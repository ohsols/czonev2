import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../firebase';
import EmojiPicker, { Theme as EmojiTheme } from 'emoji-picker-react';
import { Send, Trash2, Edit2, Check, X, ShieldCheck, Smile, DollarSign, MessageSquare, AlertCircle, Zap, Ban, Loader2, Wifi, WifiOff } from 'lucide-react';

interface ChatRoomProps {
  collectionName?: string;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
}

const BANNED_KEYWORDS = [
  'beaner', 'esex', 'negro', 'nigger', 'niggers', 'p0rn', 'porn', 'sex'
];

const ChatRoom: React.FC<ChatRoomProps> = ({ collectionName = 'chat', isAdmin = false, isSuperAdmin = false }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string, text: string, displayName: string } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  
  const isAtBottomRef = useRef(true);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;
    }
  };

  const fetchMessages = async () => {
    console.log('Fetching messages...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch('/api/chat/messages', { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Fetched messages:', data.length);
      setMessages(data);
      setError(null);
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('Failed to fetch messages:', err);
      
      // Try health check to see if API is up at all
      try {
        console.log('Attempting health check...');
        const healthController = new AbortController();
        const hTimeoutId = setTimeout(() => healthController.abort(), 3000);
        
        const healthResponse = await fetch('/api/health', { signal: healthController.signal });
        clearTimeout(hTimeoutId);
        
        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          console.log('API Health Check Success:', healthData);
          setError(`Chat API error: ${err.name === 'AbortError' ? 'Timeout' : err.message}. API is UP.`);
        } else {
          setError(`Server DOWN: HTTP ${healthResponse.status}. Retrying...`);
        }
      } catch (healthErr: any) {
        console.error('Health check failed:', healthErr);
        setError(`Server DOWN: ${healthErr.name === 'AbortError' ? 'Timeout' : healthErr.message}. Retrying...`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isAtBottomRef.current && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (cooldownRemaining > 0) {
      const timer = setTimeout(() => setCooldownRemaining(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownRemaining]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !auth.currentUser) return;

    if (!isAdmin && !isSuperAdmin && cooldownRemaining > 0) {
      setError(`Please wait ${cooldownRemaining}s before sending another message.`);
      setTimeout(() => setError(null), 2000);
      return;
    }

    const containsBanned = BANNED_KEYWORDS.some(word => 
      newMessage.toLowerCase().includes(word.toLowerCase())
    );

    if (containsBanned && !isAdmin && !isSuperAdmin) {
      setError('Your message contains prohibited language.');
      setTimeout(() => setError(null), 3000);
      return;
    }

    const messageData = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: newMessage,
      createdAt: new Date().toISOString(),
      uid: auth.currentUser.uid,
      displayName: auth.currentUser.displayName || 'Anonymous',
      role: isSuperAdmin ? 'super-admin' : (isAdmin ? 'admin' : 'user'),
      replyTo: replyTo ? { id: replyTo.id, text: replyTo.text, displayName: replyTo.displayName } : null,
    };

    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      if (!isAdmin && !isSuperAdmin) {
        setCooldownRemaining(3);
      }

      setNewMessage('');
      setReplyTo(null);
      isAtBottomRef.current = true;
      fetchMessages(); // Immediate refresh after sending
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message.');
    }
  };

  const startEdit = (id: string, text: string) => {
    setEditingMessageId(id);
    setEditValue(text);
  };

  const saveEdit = (id: string) => {
    setEditingMessageId(null);
    setEditValue('');
  };

  return (
    <div className="flex flex-col h-[800px] max-h-[95vh] bg-bg border border-white/5 rounded-2xl p-4 shadow-2xl relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full opacity-20" style={{ background: 'var(--accent-glow-dim)', filter: 'blur(100px)' }}></div>
      </div>
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
            <MessageSquare size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black italic uppercase tracking-tighter text-white">
                {collectionName === 'admin_chat' ? 'Staff Lounge' : 'Public Chat'}
              </h2>
              <Wifi size={14} className="text-green-500" />
            </div>
            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">Live Community Discussion (HTTP Polling)</p>
          </div>
        </div>
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1.5 flex items-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest"
            >
              <AlertCircle size={12} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div 
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto space-y-4 mb-4 custom-scrollbar"
      >
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-accent">
            <Loader2 className="animate-spin mb-4" size={48} />
            <p className="text-sm font-bold uppercase tracking-widest">Connecting to chat...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-text-muted opacity-50">
            <MessageSquare size={48} className="mb-4" />
            <p className="text-sm font-bold uppercase tracking-widest">No messages yet</p>
            <p className="text-[10px] mt-1">Be the first to start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={msg.id ? `msg-${msg.id}` : `idx-${index}`} className={`flex flex-col ${msg.uid === auth.currentUser?.uid ? 'items-end' : 'items-start'}`}>
              {msg.role && (msg.role === 'admin' || msg.role === 'super-admin' || msg.role === 'donator' || msg.role === 'tester') && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mb-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg ${
                    msg.role === 'super-admin' 
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black' 
                      : msg.role === 'donator'
                      ? 'bg-green-500 text-white'
                      : msg.role === 'tester'
                      ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white animate-pulse shadow-[0_0_10px_rgba(236,72,153,0.5)]'
                      : 'bg-accent text-white'
                  }`}
                >
                  {msg.role === 'donator' ? <DollarSign size={10} /> : (msg.role === 'tester' ? <Zap size={10} /> : <ShieldCheck size={10} />)}
                  {msg.role === 'super-admin' ? 'Owner' : (msg.role === 'donator' ? 'Donator 💵' : (msg.role === 'tester' ? 'Tester ✨' : 'Admin'))}
                </motion.div>
              )}
              <div className={`max-w-[70%] p-3 rounded-2xl ${msg.uid === auth.currentUser?.uid ? 'bg-accent text-white' : 'bg-white/5 text-neutral-300'}`}>
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs font-bold opacity-70">
                    {msg.displayName}
                  </p>
                  <p className="text-[10px] opacity-50 ml-2">
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                  </p>
                </div>
                {msg.replyTo && (
                  <div className="bg-white/10 p-2 rounded-lg mb-2 text-xs opacity-70 border-l-2 border-accent">
                    <p className="font-bold">{msg.replyTo.displayName}</p>
                    <p className="truncate">{msg.replyTo.text}</p>
                  </div>
                )}
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
                <div className="flex gap-2 mt-2 justify-end">
                  <button onClick={() => setReplyTo({ id: msg.id, text: msg.text, displayName: msg.displayName })} className="opacity-50 hover:opacity-100"><MessageSquare size={12} /></button>
                  {msg.uid === auth.currentUser?.uid && editingMessageId !== msg.id && (
                    <>
                      <button onClick={() => startEdit(msg.id, msg.text)} className="opacity-50 hover:opacity-100"><Edit2 size={12} /></button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div />
      </div>
      {replyTo && (
        <div className="bg-white/5 p-2 rounded-t-xl border-t border-x border-white/5 text-xs text-neutral-400 flex justify-between items-center">
          <span>Replying to <strong>{replyTo.displayName}</strong>: {replyTo.text.slice(0, 30)}...</span>
          <button onClick={() => setReplyTo(null)}><X size={14} /></button>
        </div>
      )}
      <form onSubmit={sendMessage} className="flex gap-2 relative">
        <div className="relative flex-1 flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-accent"
          />
          <button 
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 bg-white/5 rounded-xl text-neutral-400 hover:text-white transition-colors border border-white/5"
          >
            <Smile size={18} />
          </button>
          
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div 
                ref={emojiPickerRef}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full right-0 mb-2 z-50"
              >
                <EmojiPicker 
                  onEmojiClick={(emojiData) => {
                    setNewMessage(prev => prev + emojiData.emoji);
                  }}
                  theme={EmojiTheme.DARK}
                  lazyLoadEmojis={true}
                  skinTonesDisabled={true}
                  searchDisabled={false}
                  width={300}
                  height={400}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button 
          type="submit" 
          disabled={!isAdmin && !isSuperAdmin && cooldownRemaining > 0}
          className="p-2 bg-accent rounded-xl text-white hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[40px]"
        >
          {cooldownRemaining > 0 && !isAdmin && !isSuperAdmin ? (
            <span className="text-[10px] font-black">{cooldownRemaining}s</span>
          ) : (
            <Send size={18} />
          )}
        </button>
      </form>
    </div>
    </div>
  );
};

export default ChatRoom;
