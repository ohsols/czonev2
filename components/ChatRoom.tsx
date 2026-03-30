import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Send, Trash2, Edit2, Check, X } from 'lucide-react';

const ChatRoom: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'chat'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !auth.currentUser) return;

    await addDoc(collection(db, 'chat'), {
      text: newMessage,
      createdAt: serverTimestamp(),
      uid: auth.currentUser.uid,
      displayName: auth.currentUser.displayName || 'Anonymous',
    });
    setNewMessage('');
  };

  const deleteMessage = async (id: string) => {
    await deleteDoc(doc(db, 'chat', id));
  };

  const startEdit = (id: string, text: string) => {
    setEditingMessageId(id);
    setEditValue(text);
  };

  const saveEdit = async (id: string) => {
    await updateDoc(doc(db, 'chat', id), { text: editValue });
    setEditingMessageId(null);
    setEditValue('');
  };

  return (
    <div className="flex flex-col h-full bg-bg border border-white/5 rounded-2xl p-4">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.uid === auth.currentUser?.uid ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] p-3 rounded-2xl ${msg.uid === auth.currentUser?.uid ? 'bg-accent text-white' : 'bg-white/5 text-neutral-300'}`}>
              <div className="flex justify-between items-center mb-1">
                <p className="text-xs font-bold opacity-70">{msg.displayName}</p>
                <p className="text-[10px] opacity-50 ml-2">
                  {msg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {editingMessageId === msg.id ? (
                <div className="flex gap-2">
                  <input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="bg-black/20 rounded px-2 py-1 text-sm w-full"
                  />
                  <button onClick={() => saveEdit(msg.id)}><Check size={14} /></button>
                  <button onClick={() => setEditingMessageId(null)}><X size={14} /></button>
                </div>
              ) : (
                <p className="text-sm">{msg.text}</p>
              )}
              {msg.uid === auth.currentUser?.uid && editingMessageId !== msg.id && (
                <div className="flex gap-2 mt-2 justify-end">
                  <button onClick={() => startEdit(msg.id, msg.text)} className="opacity-50 hover:opacity-100"><Edit2 size={12} /></button>
                  <button onClick={() => deleteMessage(msg.id)} className="opacity-50 hover:opacity-100"><Trash2 size={12} /></button>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-accent"
        />
        <button type="submit" className="p-2 bg-accent rounded-xl text-white hover:bg-accent/90 transition-colors">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default ChatRoom;
