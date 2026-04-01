import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Edit2, Save, AlertCircle, CheckCircle2, ShieldCheck, Users, Megaphone, Activity, Send, Check } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { db, auth, OperationType, handleFirestoreError } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, serverTimestamp, Timestamp, setDoc, where, getDocs } from 'firebase/firestore';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'admin' | 'co-owner' | 'user' | 'donator';
  createdAt: Timestamp;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: Timestamp;
  active: boolean;
}

interface Suggestion {
  id: string;
  userId: string;
  userEmail: string;
  text: string;
  createdAt: Timestamp;
  status: 'pending' | 'reviewed';
}

interface AllowedAdmin {
  id: string;
  email: string;
  addedBy: string;
  createdAt: Timestamp;
}

interface AdminDashboardProps {
  onClose: () => void;
  isSuperAdmin: boolean;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose, isSuperAdmin }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [allowedAdmins, setAllowedAdmins] = useState<AllowedAdmin[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'announcements' | 'suggestions' | 'users' | 'admins' | 'analytics'>('announcements');
  const [suggestionFilter, setSuggestionFilter] = useState<'all' | 'pending' | 'reviewed'>('all');
  const [userSearchQuery, setUserSearchQuery] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'site_announcements'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Announcement[];
      setAnnouncements(data);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'site_announcements');
    });

    const qSuggestions = query(collection(db, 'suggestions'), orderBy('createdAt', 'desc'));
    const unsubscribeSuggestions = onSnapshot(qSuggestions, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Suggestion[];
      setSuggestions(data);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'suggestions');
    });

    const qAdmins = query(collection(db, 'allowed_admins'), orderBy('createdAt', 'desc'));
    const unsubscribeAdmins = onSnapshot(qAdmins, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AllowedAdmin[];
      setAllowedAdmins(data);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'allowed_admins');
    });

    const qUsers = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as User[];
      setUsers(data);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'users');
    });

    return () => {
      unsubscribe();
      unsubscribeSuggestions();
      unsubscribeAdmins();
      unsubscribeUsers();
    };
  }, []);

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await addDoc(collection(db, 'site_announcements'), {
        title: newTitle,
        content: newContent,
        authorId: auth.currentUser?.uid,
        createdAt: serverTimestamp(),
        active: true
      });
      setNewTitle('');
      setNewContent('');
      setSuccess('Announcement posted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to post announcement. Check console for details.');
      handleFirestoreError(err, OperationType.CREATE, 'site_announcements');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'site_announcements', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `site_announcements/${id}`);
    }
  };

  const toggleAnnouncementStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'site_announcements', id), {
        active: !currentStatus
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `site_announcements/${id}`);
    }
  };

  const handleMarkSuggestionReviewed = async (id: string) => {
    try {
      await updateDoc(doc(db, 'suggestions', id), {
        status: 'reviewed'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `suggestions/${id}`);
    }
  };

  const handleDeleteSuggestion = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'suggestions', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `suggestions/${id}`);
    }
  };

  const handleUpdateUserRole = async (uid: string, newRole: 'admin' | 'co-owner' | 'user' | 'donator') => {
    try {
      await updateDoc(doc(db, 'users', uid), {
        role: newRole
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const email = newAdminEmail.trim().toLowerCase();
      await setDoc(doc(db, 'allowed_admins', email), {
        email: email,
        addedBy: auth.currentUser?.uid,
        createdAt: serverTimestamp()
      });

      // Update existing user role if they already have an account
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      const updatePromises = querySnapshot.docs
        .filter(docSnap => docSnap.data().email?.toLowerCase() === email)
        .map(docSnap => updateDoc(doc(db, 'users', docSnap.id), { role: 'admin' }));
      await Promise.all(updatePromises);

      setNewAdminEmail('');
      setSuccess('Admin email added successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to add admin email. Check console for details.');
      handleFirestoreError(err, OperationType.CREATE, 'allowed_admins');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'allowed_admins', id));
      
      // Update existing user role back to user
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      const updatePromises = querySnapshot.docs
        .filter(docSnap => docSnap.data().email?.toLowerCase() === id.toLowerCase())
        .map(docSnap => updateDoc(doc(db, 'users', docSnap.id), { role: 'user' }));
      await Promise.all(updatePromises);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `allowed_admins/${id}`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-accent/20 border border-accent/30">
            <ShieldCheck className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase italic tracking-tighter">Admin Dashboard</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Authorized Personnel Only</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all border border-white/5"
        >
          <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 px-6 overflow-x-auto custom-scrollbar">
        {[
          { id: 'announcements', icon: Megaphone, label: 'Announcements' },
          { id: 'suggestions', icon: Send, label: 'Suggestions' },
          { id: 'analytics', icon: Activity, label: 'Analytics' },
          ...(isSuperAdmin ? [
            { id: 'users', icon: Users, label: 'User Management' },
            { id: 'admins', icon: ShieldCheck, label: 'Manage Admins' }
          ] : [])
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-4 text-xs font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${
              activeTab === tab.id ? 'text-accent' : 'text-neutral-500 hover:text-white'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {activeTab === 'announcements' && (
          <div className="space-y-8">
            {/* New Announcement Form */}
            <form onSubmit={handleAddAnnouncement} className="bg-white/5 rounded-2xl p-6 border border-white/5 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Plus size={16} className="text-accent" />
                New Announcement
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Announcement Title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent/50 transition-all"
                />
                <textarea
                  placeholder="Announcement Content..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={3}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent/50 transition-all resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-accent hover:bg-accent/80 disabled:opacity-50 text-white font-black uppercase tracking-widest py-3 rounded-xl transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Posting...' : 'Post Announcement'}
              </button>
              
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-red-500 text-xs font-bold bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                    <AlertCircle size={14} />
                    {error}
                  </motion.div>
                )}
                {success && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-green-500 text-xs font-bold bg-green-500/10 p-3 rounded-xl border border-green-500/20">
                    <CheckCircle2 size={14} />
                    {success}
                  </motion.div>
                )}
              </AnimatePresence>
            </form>

            {/* List */}
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-neutral-500">Recent Announcements</h3>
              {announcements.length === 0 ? (
                <div className="text-center py-12 text-neutral-600 italic text-sm">No announcements found.</div>
              ) : (
                announcements.map((ann) => (
                  <div key={ann.id} className="bg-white/5 border border-white/5 rounded-2xl p-5 flex items-start justify-between group hover:border-white/10 transition-all">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white">{ann.title}</h4>
                        {!ann.active && <span className="text-[8px] font-black uppercase tracking-widest bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded">Inactive</span>}
                      </div>
                      <p className="text-xs text-neutral-400 leading-relaxed">{ann.content}</p>
                      <p className="text-[9px] font-mono text-neutral-600">
                        {ann.createdAt?.toDate().toLocaleString() || 'Just now'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => toggleAnnouncementStatus(ann.id, ann.active)}
                        className={`p-2 rounded-lg transition-all ${ann.active ? 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20' : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'}`}
                        title={ann.active ? 'Deactivate' : 'Activate'}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-widest text-neutral-500">User Suggestions</h3>
              <div className="flex gap-2">
                {(['all', 'pending', 'reviewed'] as const).map(filter => (
                  <button
                    key={filter}
                    onClick={() => setSuggestionFilter(filter)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                      suggestionFilter === filter ? 'bg-accent text-white' : 'bg-white/5 text-neutral-500 hover:text-white'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
            {suggestions.filter(s => suggestionFilter === 'all' || s.status === suggestionFilter).length === 0 ? (
              <div className="text-center py-12 text-neutral-600 italic text-sm">No suggestions found.</div>
            ) : (
              suggestions.filter(s => suggestionFilter === 'all' || s.status === suggestionFilter).map((suggestion) => (
                <div key={suggestion.id} className="bg-white/5 border border-white/5 rounded-2xl p-5 flex items-start justify-between group hover:border-white/10 transition-all">
                  <div className="space-y-2 flex-1 pr-4">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm">{suggestion.userEmail}</h4>
                      <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                        suggestion.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-green-500/20 text-green-500'
                      }`}>
                        {suggestion.status}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-300 leading-relaxed break-words">{suggestion.text}</p>
                    <p className="text-[9px] font-mono text-neutral-600">
                      {suggestion.createdAt?.toDate().toLocaleString() || 'Just now'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                    {suggestion.status === 'pending' && (
                      <button 
                        onClick={() => handleMarkSuggestionReviewed(suggestion.id)}
                        className="p-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-500 transition-colors"
                        title="Mark as Reviewed"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeleteSuggestion(suggestion.id)}
                      className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                      title="Delete Suggestion"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {isSuperAdmin && activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-widest text-neutral-500">User Management</h3>
              <input
                type="text"
                placeholder="Search by email..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-accent/50 w-64"
              />
            </div>
            {users.filter(user => {
              if (!userSearchQuery) return true;
              return user.email?.toLowerCase().includes(userSearchQuery.toLowerCase());
            }).length === 0 ? (
              <div className="text-center py-12 text-neutral-600 italic text-sm">No users found.</div>
            ) : (
              users.filter(user => {
                if (!userSearchQuery) return true;
                return user.email?.toLowerCase().includes(userSearchQuery.toLowerCase());
              }).map((user) => (
                <div key={user.uid} className="bg-white/5 border border-white/5 rounded-2xl p-5 flex items-center justify-between group hover:border-white/10 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{user.displayName || 'Anonymous'}</h4>
                      <p className="text-xs text-neutral-400">{user.email}</p>
                      {user.createdAt && (
                        <p className="text-[10px] text-neutral-500 mt-1">
                          Joined: {user.createdAt.toDate().toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <select 
                      value={user.role}
                      onChange={(e) => handleUpdateUserRole(user.uid, e.target.value as any)}
                      className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-accent/50 transition-all cursor-pointer"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="co-owner">Co-Owner</option>
                      <option value="donator">Donator</option>
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {isSuperAdmin && activeTab === 'admins' && (
          <div className="space-y-6">
            <form onSubmit={handleAddAdmin} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-accent">Add New Admin</h3>
              
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-500 text-sm">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}
              
              {success && (
                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-2 text-green-500 text-sm">
                  <CheckCircle2 size={16} />
                  {success}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent/50 transition-colors"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !newAdminEmail.trim()}
                className="w-full py-3 rounded-xl bg-accent text-black font-black uppercase tracking-widest text-sm hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus size={18} />
                    Add Admin
                  </>
                )}
              </button>
            </form>

            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-neutral-500">Allowed Admins</h3>
              {allowedAdmins.length === 0 ? (
                <div className="text-center py-12 text-neutral-500 text-sm italic">
                  No additional admins added yet.
                </div>
              ) : (
                allowedAdmins.map((admin) => (
                  <div key={admin.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between group hover:bg-white/10 transition-colors">
                    <div>
                      <h4 className="font-bold text-white">{admin.email}</h4>
                      <p className="text-xs text-neutral-500 mt-1">
                        Added: {admin.createdAt?.toDate().toLocaleDateString()}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleDeleteAdmin(admin.id)}
                      className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      title="Remove Admin"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        {activeTab === 'analytics' && (
          <AnalyticsTab />
        )}
      </div>
    </div>
  );
};

const AnalyticsTab = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const apiUrl = (import.meta as any).env?.VITE_API_URL || window.location.origin;
        console.log('Fetching analytics from:', apiUrl);
        fetch(`${apiUrl}/api/analytics/data`)
            .then(res => {
                console.log('Response status:', res.status);
                if (!res.ok) throw new Error('Failed to fetch analytics');
                return res.json();
            })
            .then(data => {
                // Map GA4 data to a format Recharts can use
                const formattedData = data.rows?.map((row: any) => ({
                    date: row.dimensionValues[0].value.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
                    activeUsers: parseInt(row.metricValues[0].value, 10)
                })).sort((a: any, b: any) => a.date.localeCompare(b.date)) || [];
                
                setData(formattedData);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError('Failed to load analytics data.');
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="p-6 text-center text-neutral-500">Loading analytics...</div>;
    if (error) return <div className="p-6 text-center text-red-500">{error}</div>;

    return (
        <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
            <h3 className="text-sm font-black uppercase tracking-widest text-neutral-500 mb-6">Active Users (Last 30 Days)</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="date" stroke="#666" fontSize={10} />
                        <YAxis stroke="#666" fontSize={10} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#000', borderColor: '#333', color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Line type="monotone" dataKey="activeUsers" stroke="#F27D26" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export default AdminDashboard;
