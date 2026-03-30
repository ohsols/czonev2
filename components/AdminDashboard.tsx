import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Edit2, Save, AlertCircle, CheckCircle2, ShieldCheck, Users, Megaphone, Activity } from 'lucide-react';
import { db, auth, OperationType, handleFirestoreError } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: Timestamp;
  active: boolean;
}

interface AdminDashboardProps {
  onClose: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'announcements' | 'stats' | 'users'>('announcements');

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

    return () => unsubscribe();
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
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
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
      <div className="flex border-b border-white/5 px-6">
        {[
          { id: 'announcements', icon: Megaphone, label: 'Announcements' },
          { id: 'stats', icon: Activity, label: 'Site Stats' },
          { id: 'users', icon: Users, label: 'User Management' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-4 text-xs font-black uppercase tracking-widest transition-all relative ${
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

        {activeTab === 'stats' && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
              <Activity className="w-8 h-8 text-neutral-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Analytics Coming Soon</h3>
              <p className="text-xs text-neutral-500 max-w-xs mx-auto">We're working on a real-time analytics dashboard to track site traffic and user engagement.</p>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
              <Users className="w-8 h-8 text-neutral-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold">User Management Coming Soon</h3>
              <p className="text-xs text-neutral-500 max-w-xs mx-auto">Manage user roles, permissions, and account status from this panel.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
