
import React, { useRef } from 'react';
import { Home, Film, Tv, Sparkles, BookOpen, Heart, Camera, Globe, Users, DollarSign, Gamepad2, LayoutGrid, Settings as SettingsIcon, Shield, Code, Music } from 'lucide-react';
import { Category } from '../types';
import { motion } from 'framer-motion';

interface SidebarProps {
  activeCategory: Category;
  onSelect: (category: Category) => void;
  logoUrl: string;
  onLogoChange: (newLogo: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeCategory, onSelect, logoUrl, onLogoChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        onLogoChange(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const navItems = [
    { id: 'support' as Category, label: 'Devs', icon: Heart },
    { id: 'donate' as Category, label: 'Donate', icon: DollarSign },
    { id: 'movies' as Category, label: 'Movies', icon: Film },
    { id: 'tv shows' as Category, label: 'TV Shows', icon: Tv },
    { id: 'anime' as Category, label: 'Animes', icon: Sparkles },
    { id: 'manga' as Category, label: 'Mangas', icon: BookOpen },
    { id: 'music' as Category, label: 'Music', icon: Music },
    { id: 'proxies' as Category, label: 'Proxies', icon: Shield },
  ];

  return (
    <aside className="w-64 bg-black border-r border-white/10 flex flex-col p-6 shrink-0 transition-all duration-500 z-50 h-full pointer-events-auto">
      <div className="mb-10 flex flex-col items-center justify-center">
        <motion.div 
          whileHover={{ scale: 1.05, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          className="relative group/logo cursor-pointer" 
          onClick={handleLogoClick}
        >
          <div className="w-16 h-16 shrink-0 overflow-hidden relative z-10 shadow-[0_0_30px_rgba(255,255,255,0.1)] rounded-2xl">
            <img 
              src={logoUrl} 
              alt="Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="mt-4 text-center">
            <h2 className="text-sm font-black italic uppercase tracking-tighter text-white">Czone</h2>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange}
          />
        </motion.div>
      </div>
      
      <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-2 pointer-events-auto">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = activeCategory === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`relative z-50 w-full flex items-center justify-center md:justify-start gap-4 p-4 rounded-xl transition-colors duration-300 font-bold uppercase tracking-widest text-xs ${
                isActive 
                  ? 'bg-[#ff2644] text-white' 
                  : 'text-[#52525b] hover:bg-[#1c1c1f] hover:text-white'
              }`}
            >
              <Icon size={20} className="relative z-10" />
              <span className="relative z-10">{item.label}</span>
              {isActive && (
                <div
                  className="absolute inset-0 bg-[#ff2644] rounded-xl z-0"
                />
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
