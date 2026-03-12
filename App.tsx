import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';
import LibrarySection from './components/LibrarySection';
import Settings from './components/Settings';
import MusicPlayer from './components/MusicPlayer';
import UpdateLog from './components/UpdateLog';
import DateTimeWidget from './components/DateTimeWidget';
import { Category, LibraryItem, StaffMember } from './types';
import { MOVIES_DATA, ANIME_DATA, MANGA_DATA, TV_DATA, STAFF_DATA, PARTNERS_DATA, PROXIES_DATA, GAMES_DATA } from './constants';
import GamesSection from './components/GamesSection';
import { getWikiIntelligence } from './services/gemini';
import { Search, X, Film, Sparkles, BookOpen, Tv, SearchX, PlayCircle, Star, Globe, Users, ExternalLink, ShieldAlert, Zap, MessageSquare, Activity, Loader2, Book, AlertTriangle, Settings as SettingsIcon, GitCommit } from 'lucide-react';

const DEFAULT_LOGO = "https://lh7-rt.googleusercontent.com/sitesz/AClOY7psM7n5cC2oRAQVLVss3LsgYFKWwE-KzTjGQvDYtnnp1f1j-Szl1OH6r1pZTXpsw0t_1es0N4P9E2cBl4Oqs-lOwNJdAt3H5CiGxGZKfBTzaYq_ybiI1qd2dWXWu_GRWMqLDD_3BL9tkNhJBNJhjBuuQWyvP1B19h6v0fblyHBwfxs-94c7?key=IannGxLsV9P5UfJ0NHPqqQ";

const DiscordIcon = ({ size = 20, className = "" }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1971.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/>
  </svg>
);

const App: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<Category>('movies');
  const [searchQuery, setSearchQuery] = useState('');
  const [proxySearch, setProxySearch] = useState('');
  const [customLogo, setCustomLogo] = useState<string>(DEFAULT_LOGO);
  const [selectedItem, setSelectedItem] = useState<{item: LibraryItem, category: string} | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUpdateLogOpen, setIsUpdateLogOpen] = useState(false);
  const [wikiData, setWikiData] = useState<{text: string, sources: string[]} | null>(null);
  const [isWikiLoading, setIsWikiLoading] = useState(false);

  useEffect(() => {
    const savedLogo = localStorage.getItem('chillzone_custom_logo');
    if (savedLogo) setCustomLogo(savedLogo);
  }, []);

  const handleUpdateLogo = (newLogoUrl: string) => {
    setCustomLogo(newLogoUrl);
    localStorage.setItem('chillzone_custom_logo', newLogoUrl);
  };

  const handleOpenDetails = (item: LibraryItem, category: string) => {
    setSelectedItem({ item, category });
    setWikiData(null);
  };

  const handleStaffClick = (staff: StaffMember) => {
    if (staff.link) {
      setSelectedStaff(staff);
    }
  };

  const handleFetchWiki = async () => {
    if (!selectedItem) return;
    setIsWikiLoading(true);
    const intelligence = await getWikiIntelligence(selectedItem.item.t);
    setWikiData(intelligence);
    setIsWikiLoading(false);
  };

  const [searchCategory, setSearchCategory] = useState<'all' | 'movies' | 'tv' | 'anime' | 'manga'>('all');

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    
    // First filter by text
    const textFilter = (item: LibraryItem) => item.t.toLowerCase().includes(q);
    
    // Then apply text filter
    const results = {
      movies: MOVIES_DATA.filter(textFilter),
      anime: ANIME_DATA.filter(textFilter),
      manga: MANGA_DATA.filter(textFilter),
      tv: TV_DATA.filter(textFilter),
    };

    if (searchCategory !== 'all') {
      return {
        movies: searchCategory === 'movies' ? results.movies : [],
        anime: searchCategory === 'anime' ? results.anime : [],
        manga: searchCategory === 'manga' ? results.manga : [],
        tv: searchCategory === 'tv' ? results.tv : [],
      };
    }

    return results;
  }, [searchQuery, searchCategory]);

  const totalMatches = searchResults ? 
    searchResults.movies.length + searchResults.anime.length + searchResults.manga.length + searchResults.tv.length : 0;

  // Check if the current link is a fallback search link
  const isSearchLink = selectedItem?.item.l?.includes('drive.google.com/drive/search');

  return (
    <div className="min-h-screen bg-black text-[#fafafa]">
      <div id="app" className="fixed inset-0 flex flex-row overflow-hidden bg-black text-[#fafafa]">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full opacity-60" style={{ background: 'rgba(255,38,68,0.08)', filter: 'blur(160px)', transform: 'translateZ(0)' }}></div>
          <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] rounded-full opacity-30" style={{ background: 'rgba(37,99,235,0.05)', filter: 'blur(130px)', transform: 'translateZ(0)' }}></div>
        </div>
        
        <Sidebar activeCategory={activeCategory} onSelect={(cat) => { setActiveCategory(cat); setSearchQuery(''); setIsSettingsOpen(false); }} logoUrl={customLogo} onLogoChange={handleUpdateLogo} />
        
        <main className="flex-1 flex flex-col min-w-0 h-full relative z-10 overflow-auto custom-scrollbar">
          <header className="sticky top-0 z-40 border-b border-[#1c1c1f] p-4 md:p-6 flex justify-between items-center shrink-0 bg-black/60 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <DateTimeWidget />
            </div>
            <div className="flex items-center gap-3 relative">
              <div className="relative">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsUpdateLogOpen(!isUpdateLogOpen)} 
                  className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all duration-300 ${
                    isUpdateLogOpen 
                      ? 'bg-[#ff2644] border-[#ff2644] text-white' 
                      : 'bg-[#1c1c1f] border-white/5 text-[#52525b] hover:text-white hover:border-white/20'
                  }`}
                  title="Update Log"
                >
                  <GitCommit size={18} />
                </motion.button>
                <AnimatePresence>
                  {isUpdateLogOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsUpdateLogOpen(false)}
                      />
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 10, x: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10, x: -20 }}
                        className="absolute top-14 right-0 z-50 bg-[#0a0a0a] border border-[#1c1c1f] rounded-2xl shadow-2xl overflow-hidden"
                      >
                        <UpdateLog onClose={() => setIsUpdateLogOpen(false)} />
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <motion.a 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="https://discord.gg/7jxU9cgsHV" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#1c1c1f] border border-white/5 text-[#52525b] hover:text-[#5865F2] hover:border-[#5865F2]/50 transition-all duration-300"
                title="Discord"
              >
                <DiscordIcon size={18} />
              </motion.a>
              <div className="relative">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)} 
                  className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all duration-300 ${
                    isSettingsOpen 
                      ? 'bg-[#ff2644] border-[#ff2644] text-white' 
                      : 'bg-[#1c1c1f] border-white/5 text-[#52525b] hover:text-white hover:border-white/20'
                  }`}
                  title="Settings"
                >
                  <motion.div
                    animate={{ rotate: isSettingsOpen ? 180 : 0 }}
                    transition={{ duration: 0.4, ease: "backOut" }}
                  >
                    <SettingsIcon size={18} />
                  </motion.div>
                </motion.button>
                
                <AnimatePresence>
                  {isSettingsOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsSettingsOpen(false)}
                      />
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 10, x: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10, x: 20 }}
                        className="absolute top-14 right-0 z-50 bg-[#0a0a0a] border border-[#1c1c1f] rounded-2xl shadow-2xl overflow-hidden"
                      >
                        <Settings />
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>

          <div id="content-area" className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-10 custom-scrollbar overscroll-contain">
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
              {/* Hero Section */}
              {activeCategory !== 'music' && (
                <motion.section 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className=""
                >
                </motion.section>
              )}
              {searchQuery ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-12 pb-24"
                >
                   <div className="flex flex-wrap gap-2 mb-8">
                     {(['all', 'movies', 'tv', 'anime', 'manga'] as const).map(cat => (
                       <motion.button
                         whileHover={{ scale: 1.05 }}
                         whileTap={{ scale: 0.95 }}
                         key={cat}
                         onClick={() => setSearchCategory(cat)}
                         className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest border transition-all duration-300 ${
                           searchCategory === cat 
                             ? 'bg-[#ff2644] text-white border-[#ff2644]' 
                             : 'bg-black text-[#52525b] border-[#1c1c1f] hover:border-[#ff2644]/50 hover:text-white'
                         }`}
                       >
                         {cat === 'all' ? 'All Categories' : cat}
                       </motion.button>
                     ))}
                   </div>
                   {searchResults?.movies.length ? <LibrarySection title="Movies" items={searchResults.movies} category="movie" searchQuery={searchQuery} onOpenDetails={handleOpenDetails} /> : null}
                   {searchResults?.tv.length ? <LibrarySection title="TV" items={searchResults.tv} category="tv" searchQuery={searchQuery} onOpenDetails={handleOpenDetails} /> : null}
                   {searchResults?.anime.length ? <LibrarySection title="Anime" items={searchResults.anime} category="anime" searchQuery={searchQuery} onOpenDetails={handleOpenDetails} /> : null}
                   {searchResults?.manga.length ? <LibrarySection title="Manga" items={searchResults.manga} category="manga" searchQuery={searchQuery} onOpenDetails={handleOpenDetails} /> : null}
                   {totalMatches === 0 && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-40 text-center opacity-40"
                      >
                        <SearchX size={80} className="mb-6 text-[#ff2644]" />
                        <h2 className="text-2xl font-black uppercase tracking-widest italic mb-2 text-white">No matches</h2>
                      </motion.div>
                   )}
                </motion.div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={activeCategory}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="w-full pb-24"
                  >
                    {activeCategory === 'movies' && <LibrarySection title="Movies" items={MOVIES_DATA} category="movie" searchQuery="" onOpenDetails={handleOpenDetails} showSearch={true} />}
                    {activeCategory === 'tv shows' && <LibrarySection title="TV Series" items={TV_DATA} category="tv" searchQuery="" onOpenDetails={handleOpenDetails} showSearch={true} />}
                    {activeCategory === 'anime' && <LibrarySection title="Anime" items={ANIME_DATA} category="anime" searchQuery="" onOpenDetails={handleOpenDetails} showSearch={true} />}
                    {activeCategory === 'manga' && <LibrarySection title="Manga Archive" items={MANGA_DATA} category="manga" searchQuery="" onOpenDetails={handleOpenDetails} showSearch={true} />}
                    {activeCategory === 'games' && <GamesSection games={GAMES_DATA} onOpenDetails={(game) => handleOpenDetails({ t: game.title, l: game.link, img: game.image, desc: game.desc }, 'games')} />}
                    {activeCategory === 'music' && <MusicPlayer />}
                    
                    {activeCategory === 'proxies' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="py-12 px-6"
                      >
                        <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white mb-10">Proxy Links</h1>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {PROXIES_DATA.map((proxy, idx) => (
                            <a 
                              key={idx} 
                              href={proxy.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="bg-[#1c1c1f] p-6 rounded-xl border border-white/5 hover:border-[#ff2644]/40 transition-colors flex items-center justify-between group"
                            >
                              <span className="text-white font-bold">{proxy.name || proxy.url}</span>
                              <ExternalLink size={16} className="text-[#52525b] group-hover:text-[#ff2644]" />
                            </a>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {activeCategory === 'partners' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="py-12"
                      >
                        <motion.h1 
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-7xl md:text-9xl font-black mb-20 tracking-tighter italic uppercase text-white text-center leading-[0.8]"
                        >
                          PARTNERS
                        </motion.h1>
                        <motion.div 
                          initial="hidden"
                          animate="show"
                          variants={{
                            hidden: { opacity: 0 },
                            show: {
                              opacity: 1,
                              transition: { staggerChildren: 0.05 }
                            }
                          }}
                          className="grid grid-cols-1 md:grid-cols-2 gap-6"
                        >
                          {PARTNERS_DATA.map((p, idx) => (
                            <motion.a 
                              variants={{
                                hidden: { opacity: 0, y: 10 },
                                show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } }
                              }}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              key={idx} 
                              href={p.url || '#'} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="relative overflow-hidden bg-black p-8 rounded-[32px] border border-[#1c1c1f] flex items-center group transition-all duration-500 hover:border-[#ff2644]/40"
                            >
                              {p.banner && (
                                <div className="absolute inset-0">
                                  <img src={p.banner} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700" />
                                  <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent"></div>
                                </div>
                              )}
                              <div className="relative z-10 flex items-center justify-between w-full">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-black/80 backdrop-blur-md rounded-xl text-[#ff2644] border border-white/5 flex items-center justify-center overflow-hidden">
                                    {p.avatar ? <img src={p.avatar} className="w-full h-full object-cover" /> : <Users size={24} />}
                                  </div>
                                  <div>
                                    <h3 className="text-xl font-black italic uppercase text-white group-hover:text-[#ff2644] transition-colors">{p.name}</h3>
                                    <p className="text-[#a1a1aa] text-[9px] font-bold uppercase tracking-[0.2em]">OPERATED BY {p.owner}</p>
                                  </div>
                                </div>
                                {p.url && <ExternalLink size={20} className="text-[#52525b] group-hover:text-[#ff2644]" />}
                              </div>
                            </motion.a>
                          ))}
                        </motion.div>
                      </motion.div>
                    )}

                    {activeCategory === 'support' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="py-12 space-y-16"
                      >
                        <div className="text-center">
                          <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter text-white mb-4">
                            Developers
                          </h1>
                          <p className="text-[#a1a1aa] text-lg font-medium max-w-2xl mx-auto">
                            The team behind ChillZone. <span className="text-[#ff2644] font-bold">Click on our cards</span> to visit our personal sites and socials!
                          </p>
                        </div>
                        <section>

                          <motion.div 
                            initial="hidden"
                            animate="show"
                            variants={{
                              hidden: { opacity: 0 },
                              show: {
                                opacity: 1,
                                transition: { staggerChildren: 0.05 }
                              }
                            }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10"
                          >
                            {STAFF_DATA.map((staff, idx) => (
                              <motion.div 
                                variants={{
                                  hidden: { opacity: 0, y: 15 },
                                  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
                                }}
                                whileHover={{ y: -10 }}
                                key={idx} 
                                onClick={() => handleStaffClick(staff)} 
                                className={`bg-black border border-[#1c1c1f] p-10 rounded-[48px] text-center group hover:border-[#ff2644]/40 transition-all duration-700 shadow-2xl overflow-hidden relative ${staff.link ? 'cursor-pointer hover:bg-[#1c1c1f]' : ''}`}
                              >
                                <div className="w-40 h-40 mx-auto mb-10 rounded-[40px] overflow-hidden border-2 border-[#1c1c1f] group-hover:border-[#ff2644]/40 transition-all duration-700 shadow-inner relative bg-black">
                                  {staff.img ? (
                                    <img src={staff.img} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                                  ) : (
                                    <div className="flex items-center justify-center h-full text-[#3f3f46]"><Users size={48} /></div>
                                  )}
                                </div>
                                <h3 className="text-2xl font-black mb-3 italic uppercase text-white">{staff.name}</h3>
                                <p className="text-[#ff2644] font-black text-[9px] uppercase tracking-[0.35em]">{staff.role}</p>
                                {staff.link && (
                                  <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="bg-[#ff2644] text-white text-[8px] font-black uppercase tracking-widest py-1.5 px-3 rounded-full flex items-center gap-1.5 shadow-lg">
                                      <ExternalLink size={10} /> Visit Site
                                    </div>
                                  </div>
                                )}
                              </motion.div>
                            ))}
                          </motion.div>
                        </section>
                      </motion.div>
                    )}

                    {activeCategory === 'donate' && (
                      <div className="py-12">
                        <section className="bg-black rounded-[48px] p-12 md:p-20 border border-[#1c1c1f] text-center relative overflow-hidden">
                          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=2000')] bg-cover bg-center opacity-10 blur-sm"></div>
                          <div className="relative z-10">
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 200, damping: 20 }}
                              className="w-24 h-24 bg-black rounded-full flex items-center justify-center mx-auto mb-8 border border-[#ff2644]/30 shadow-[0_0_40px_rgba(255,38,68,0.3)]"
                            >
                              <Activity size={48} className="text-[#ff2644]" />
                            </motion.div>
                            <motion.h1 
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 }}
                              className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter text-white mb-8"
                            >
                              Donate
                            </motion.h1>
                            <motion.p 
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 }}
                              className="text-[#a1a1aa] text-xl max-w-2xl mx-auto mb-12 font-medium"
                            >
                              Click Which Ever Donation App U Want To Donate On
                            </motion.p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                              <motion.a 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                href="https://cash.app/$7yari" target="_blank" rel="noopener noreferrer" className="bg-black border border-[#1c1c1f] p-8 rounded-3xl hover:border-[#00d632] transition-all duration-300 group flex flex-col items-center text-center"
                              >
                                <img src="https://cdn.simpleicons.org/cashapp/white" alt="Cash App" className="h-12 w-12 mb-4 object-contain" referrerPolicy="no-referrer" />
                                <div className="text-3xl font-black text-white mb-2">CASH APP</div>
                                <p className="text-[#52525b] text-xs font-bold uppercase tracking-widest group-hover:text-[#00d632]">Instant Transfer</p>
                              </motion.a>
                              <motion.a 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                href="https://www.venmo.com/u/ohsols" target="_blank" rel="noopener noreferrer" className="bg-[#008CFF] border border-[#008CFF] p-8 rounded-3xl hover:bg-[#008CFF]/90 transition-all duration-300 shadow-[0_0_30px_rgba(0,140,255,0.4)] flex flex-col items-center text-center"
                              >
                                <img src="https://cdn.simpleicons.org/venmo/white" alt="Venmo" className="h-12 w-12 mb-4 object-contain" referrerPolicy="no-referrer" />
                                <div className="text-3xl font-black text-white mb-2">VENMO</div>
                                <p className="text-white/80 text-xs font-bold uppercase tracking-widest">Mobile Payment</p>
                              </motion.a>
                              <motion.a 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                href="https://paypal.me/ohsols" target="_blank" rel="noopener noreferrer" className="bg-black border border-[#1c1c1f] p-8 rounded-3xl hover:border-[#0070ba] transition-all duration-300 group flex flex-col items-center text-center"
                              >
                                <img src="https://cdn.simpleicons.org/paypal/white" alt="PayPal" className="h-12 w-12 mb-4 object-contain" referrerPolicy="no-referrer" />
                                <div className="text-3xl font-black text-white mb-2">PAYPAL</div>
                                <p className="text-[#52525b] text-xs font-bold uppercase tracking-widest group-hover:text-[#0070ba]">Direct Transfer</p>
                              </motion.a>
                            </div>
                          </div>
                        </section>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {selectedStaff && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" 
            onClick={() => setSelectedStaff(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-black border border-[#ff2644]/20 p-8 rounded-3xl max-w-md w-full text-center shadow-[0_0_50px_rgba(255,38,68,0.2)] relative" 
              onClick={e => e.stopPropagation()}
            >
              <ShieldAlert size={48} className="mx-auto text-[#ff2644] mb-6" />
              <h3 className="text-2xl font-black italic uppercase text-white mb-4">External Link Warning</h3>
              <p className="text-[#a1a1aa] mb-8 font-medium">You are about to leave Chillzone to view <span className="text-white font-bold">{selectedStaff.name}'s</span> socials. Proceed with caution.</p>
              <div className="flex gap-4">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setSelectedStaff(null)} className="flex-1 py-4 rounded-xl bg-[#27272a] text-white font-bold uppercase tracking-widest text-xs hover:bg-[#3f3f46] transition-colors">Abort</motion.button>
                <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} href={selectedStaff.link} target="_blank" onClick={() => setSelectedStaff(null)} className="flex-1 py-4 rounded-xl bg-[#ff2644] text-white font-bold uppercase tracking-widest text-xs hover:bg-[#ff2644]/80 transition-colors flex items-center justify-center gap-2">Proceed <ExternalLink size={14} /></motion.a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] flex items-center justify-center p-4 md:p-10"
          >
            <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl" onClick={() => setSelectedItem(null)}></div>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-5xl bg-black border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
            >
              <button onClick={() => setSelectedItem(null)} className="absolute top-8 right-8 z-50 bg-black/40 hover:bg-[#ff2644] p-4 rounded-2xl transition-all duration-300 border border-white/5"><X size={24} /></button>
              <div className="w-full md:w-2/5 aspect-[2/3] md:h-auto relative overflow-hidden group/modal-img bg-black shrink-0">
                <img src={selectedItem.item.img} className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover/modal-img:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
              </div>
              <div className="flex-1 p-10 md:p-16 flex flex-col overflow-y-auto custom-scrollbar">
                <div className="mb-auto">
                  <div className="flex items-center gap-4 mb-6"><span className="px-5 py-2 rounded-full bg-[#ff2644]/10 border border-[#ff2644]/30 text-[#ff2644] text-[10px] font-black uppercase tracking-[0.25em] italic">Record Sync Active</span></div>
                  <h2 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-white leading-[0.85] mb-10">{selectedItem.item.t}</h2>
                  
                  {wikiData ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <p className="text-[#d4d4d8] leading-relaxed text-lg font-medium border-l-2 border-[#ff2644] pl-6 italic">{wikiData.text}</p>
                      <div className="flex flex-wrap gap-2 pt-4">
                        {wikiData.sources.map((url, i) => (
                          <a key={i} href={url} target="_blank" className="text-[10px] text-[#52525b] hover:text-[#ff2644] uppercase tracking-widest font-black flex items-center gap-1">SOURCE {i+1} <ExternalLink size={10}/></a>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <p className="text-[#d4d4d8] leading-relaxed text-lg mb-12 font-medium">Accessing <span className="text-white italic font-black">"{selectedItem.item.t}"</span>. Syncing through redundant peer nodes for maximum throughput.</p>
                  )}
                </div>
                
                <div className="flex flex-col gap-4 mt-8">
                  {!wikiData && (
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleFetchWiki} 
                      disabled={isWikiLoading}
                      className="w-full bg-black text-white py-6 rounded-[2rem] font-black flex items-center justify-center gap-4 text-[10px] tracking-[0.4em] uppercase italic border border-white/5 hover:bg-[#27272a] transition-all duration-300 disabled:opacity-50"
                    >
                      {isWikiLoading ? <Loader2 size={18} className="animate-spin text-[#ff2644]"/> : <Book size={18} className="text-[#ff2644]"/>} 
                      {isWikiLoading ? 'DECRYPTING WIKI...' : 'FETCH WIKI INTELLIGENCE'}
                    </motion.button>
                  )}
                  {selectedItem.item.links && selectedItem.item.links.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {selectedItem.item.links.map((link, idx) => (
                        <motion.a 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          key={idx}
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-full py-5 rounded-[2rem] font-black flex items-center justify-center gap-4 text-xs tracking-[0.4em] uppercase italic transition-all duration-500 shadow-xl bg-[#ff2644] text-white hover:bg-[#ff2644]/90"
                        >
                          <PlayCircle size={20} /> 
                          {link.part}
                        </motion.a>
                      ))}
                    </div>
                  ) : (
                    <motion.a 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      href={selectedItem.item.l} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`w-full py-7 rounded-[2.5rem] font-black flex items-center justify-center gap-4 text-xs tracking-[0.4em] uppercase italic transition-all duration-500 shadow-2xl ${isSearchLink ? 'bg-[#27272a] text-[#a1a1aa] hover:bg-[#3f3f46] hover:text-white border border-white/10' : 'bg-[#ff2644] text-white hover:bg-[#ff2644]/90'}`}
                    >
                      {isSearchLink ? <Search size={24} /> : <PlayCircle size={24} />} 
                      {isSearchLink ? 'SEARCH ARCHIVE' : 'INITIALIZE STREAM'}
                    </motion.a>
                  )}
                  {isSearchLink && (
                    <p className="text-center text-[10px] text-[#52525b] mt-2 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                      <AlertTriangle size={12} /> Direct Feed Offline • Initiating Search Protocol
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
