
import React from 'react';
import { X, GitCommit, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

interface UpdateLogProps {
  onClose: () => void;
}

const UPDATES = [
  {
    version: "1.0.0",
    date: "2026-03-10",
    changes: ["Site Release 🎉"]
  }
];

const getDaysAgo = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 0 ? "Today" : `${diffDays} days ago`;
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const UpdateLog: React.FC<UpdateLogProps> = ({ onClose }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -20 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="w-80 max-h-[400px] flex flex-col bg-[#0a0a0a] text-white rounded-xl overflow-hidden shadow-2xl border border-white/10"
    >
      <div className="p-4 border-b border-[#1c1c1f] flex items-center justify-between sticky top-0 bg-[#0a0a0a] z-10">
        <h3 className="font-black uppercase italic tracking-tighter text-lg flex items-center gap-2">
          <GitCommit size={16} className="text-[#ff2644]" />
          Update Log
        </h3>
        <button onClick={onClose} className="text-[#52525b] hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="overflow-y-auto custom-scrollbar p-4 space-y-6"
      >
        {UPDATES.map((update, idx) => (
          <motion.div key={idx} variants={itemVariants} className="relative pl-4 border-l border-[#1c1c1f]">
            <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-[#1c1c1f] border border-[#52525b]"></div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#ff2644] font-bold text-xs bg-[#ff2644]/10 px-2 py-0.5 rounded-full border border-[#ff2644]/20">v{update.version}</span>
              <span className="text-[10px] text-[#52525b] font-mono flex items-center gap-1">
                <Calendar size={10} />
                {getDaysAgo(update.date)}
              </span>
            </div>
            <ul className="space-y-1">
              {update.changes.map((change, cIdx) => (
                <li key={cIdx} className="text-xs text-[#d4d4d8] leading-relaxed">
                  • {change}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default UpdateLog;
