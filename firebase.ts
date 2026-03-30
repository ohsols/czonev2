import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, onSnapshot, query, orderBy, limit, getDocFromServer, FirestoreError, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  console.log("Starting Google Sign-In...");
  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Google Sign-In successful:", result.user.email);
    // Create user doc if it doesn't exist
    const userDoc = doc(db, 'users', result.user.uid);
    const docSnap = await getDoc(userDoc);
    if (!docSnap.exists()) {
      console.log("Creating new user document for:", result.user.email);
      await setDoc(userDoc, {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        role: result.user.email === 'darkfn1234567890@gmail.com' ? 'admin' : 'user',
        createdAt: serverTimestamp()
      });
    }
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

export const signUpWithEmail = async (email: string, pass: string, username: string) => {
  console.log("Starting Email Sign-Up for:", email);
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    console.log("Email Sign-Up successful:", result.user.email);
    await updateProfile(result.user, { displayName: username });
    
    // Create user doc
    console.log("Creating user document for:", email);
    await setDoc(doc(db, 'users', result.user.uid), {
      uid: result.user.uid,
      email: result.user.email,
      displayName: username,
      role: result.user.email === 'darkfn1234567890@gmail.com' ? 'admin' : 'user',
      createdAt: serverTimestamp()
    });
    
    return result.user;
  } catch (error) {
    console.error("Error signing up with email:", error);
    throw error;
  }
};

export const loginWithEmail = async (email: string, pass: string) => {
  console.log("Starting Email Login for:", email);
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    console.log("Email Login successful:", result.user.email);
    return result.user;
  } catch (error) {
    console.error("Error logging in with email:", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection to Firestore
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();
