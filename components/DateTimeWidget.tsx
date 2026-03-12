import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const DateTimeWidget = () => {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 300, damping: 24 }}
      className="bg-black/60 backdrop-blur-xl text-[#ff2644] px-6 py-2 rounded-2xl border border-[#ff2644]/20 shadow-2xl flex flex-row items-center gap-4 hover:border-[#ff2644]/50 transition-colors cursor-default"
    >
      <div className="text-[10px] font-black uppercase tracking-widest text-[#ff2644]">
        {dateTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}
      </div>
      <div className="text-sm font-mono font-bold tracking-tight text-white">
        {dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }).toUpperCase()}
      </div>
    </motion.div>
  );
};

export default DateTimeWidget;
