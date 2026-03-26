import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Star, Box, Play, Puzzle, Bomb, Beer, Plane, Leaf, Skull, Bike, Trophy, Zap, Hand, Target, 
  Sprout, Rocket, Ghost, Gamepad2, Swords, Dribbble, Eye, Camera, Crown, Triangle, Bug, Pizza,
  Dribbble as Football, Dribbble as Basketball, Smartphone, Wind, Shield, CircleDot, Clock, 
  FastForward, Sparkles, ChevronRight, ChevronLeft, Flame, History, LayoutGrid, List, Plus, X as CloseIcon,
  Trash2, Edit3, Save
} from 'lucide-react';
import { GAMES as INITIAL_GAMES } from '../gameData';
import { FavoriteItem, Game } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface GamesHubProps {
  favorites: FavoriteItem[];
  onToggleFavorite: (item: FavoriteItem) => void;
  setSelectedGame: (game: Game | null) => void;
}

const iconMap: Record<string, any> = {
  "fa-puzzle-piece": Puzzle,
  "fa-bomb": Bomb,
  "fa-beer-mug-empty": Beer,
  "fa-plane": Plane,
  "fa-leaf": Leaf,
  "fa-skull": Skull,
  "fa-motorcycle": Bike,
  "fa-futbol": Dribbble,
  "fa-football": Football,
  "fa-basketball": Basketball,
  "fa-mobile": Smartphone,
  "fa-mobile-screen": Smartphone,
  "fa-wind": Wind,
  "fa-shield-halved": Shield,
  "fa-circle-dot": CircleDot,
  "fa-clock": Clock,
  "fa-forward-fast": FastForward,
  "fa-sparkles": Sparkles,
  "fa-bolt": Zap,
  "fa-hand-pointer": Hand,
  "fa-gun": Target,
  "fa-seedling": Sprout,
  "fa-user-astronaut": Rocket,
  "fa-ghost": Ghost,
  "fa-gamepad": Gamepad2,
  "fa-hammer": Swords,
  "fa-folder-open": Box,
  "fa-mask": Ghost,
  "fa-house": Box,
  "fa-moon": Eye,
  "fa-mushroom": Pizza,
  "fa-face-laugh-squint": Eye,
  "fa-bone": Skull,
  "fa-subway": Rocket,
  "fa-drumstick-bite": Pizza,
  "fa-cat": Ghost,
  "fa-hat-wizard": Crown,
  "fa-microphone-lines": Hand,
  "fa-face-smile": Eye,
  "fa-rabbit": Ghost,
  "fa-face-laugh": Eye,
  "fa-cookie-bite": Pizza,
  "fa-compact-disc": Target,
  "fa-spray-can": Rocket,
  "fa-piggy-bank": Box,
  "fa-shuffle": Swords,
  "fa-rotate": Swords,
  "fa-horse": Ghost,
  "fa-circle-exclamation": Eye,
  "fa-user-ninja": Swords,
  "fa-bug": Bug,
  "fa-microchip": Box,
  "fa-cloud-meatball": Pizza,
  "fa-cube": Box,
  "fa-question": Eye,
  "fa-virus": Bug,
  "fa-hand-fist": Hand,
  "fa-fingerprint": Hand,
  "fa-bed": Box,
  "fa-eye": Eye,
  "fa-dragon": Ghost,
  "fa-droplet": Leaf,
  "fa-anchor": Target,
  "fa-mitten": Hand,
  "fa-feather": Leaf,
  "fa-bottle-water": Beer,
  "fa-laptop": Box,
};

interface GameCardProps {
  key?: string | number;
  game: Game;
  size?: 'sm' | 'md' | 'lg';
  favorites: FavoriteItem[];
  onToggleFavorite: (item: FavoriteItem) => void;
  handlePlayGame: (game: Game) => void;
  isCustom: boolean;
  handleDeleteCustomGame: (id: string) => void;
  featuredId: string;
  setFeaturedId: (id: string) => void;
  saveSettings: (updates: any) => void;
  accentColor: string;
}

const GameCard = ({ 
  game, 
  size = 'md', 
  favorites, 
  onToggleFavorite, 
  handlePlayGame, 
  isCustom, 
  handleDeleteCustomGame, 
  featuredId, 
  setFeaturedId, 
  saveSettings, 
  accentColor 
}: GameCardProps) => {
  const isFavorited = favorites.some(f => f.id === game.id);
  const isFeatured = featuredId === game.id;
  const IconComponent = iconMap[game.icon] || Gamepad2;
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -10 }}
      className={`group relative rounded-2xl overflow-hidden flex flex-col border border-white/10 transition-all duration-500 bg-[#121212] shrink-0 ${
        size === 'lg' ? 'w-80 h-[450px]' : size === 'sm' ? 'w-48 h-64' : 'w-64 h-80'
      }`}
    >
      {game.image && (
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 opacity-100 group-hover:scale-110 z-0" 
          style={{ backgroundImage: `url('${game.image}')` }}
        />
      )}
      
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent z-0 pointer-events-none" />

      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${game.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20`} />
      
      <div className="relative z-10 p-5 h-full flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="p-2.5 bg-black/40 backdrop-blur-md rounded-xl border border-white/5 group-hover:border-white/20 transition-all">
            <IconComponent className={`w-5 h-5 ${game.iconColor} drop-shadow-md`} />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); setFeaturedId(game.id); saveSettings({ featuredId: game.id }); }}
              className={`p-2 rounded-full backdrop-blur-md border transition-all opacity-0 group-hover:opacity-100 ${
                isFeatured ? 'bg-accent border-accent text-black opacity-100' : 'bg-black/40 border-white/10 text-white hover:text-accent'
              }`}
              title="Set as Featured"
              style={{ 
                backgroundColor: isFeatured ? accentColor : 'rgba(0,0,0,0.4)',
                borderColor: isFeatured ? accentColor : 'rgba(255,255,255,0.1)'
              }}
            >
              <Crown className="w-3.5 h-3.5" />
            </button>
            {isCustom && (
              <button 
                onClick={(e) => { e.stopPropagation(); handleDeleteCustomGame(game.id); }}
                className="p-2 rounded-full backdrop-blur-md border border-white/10 text-red-500 hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite({
                  id: game.id,
                  type: 'game',
                  title: game.title,
                  imageUrl: game.image || 'https://picsum.photos/seed/game/400/600',
                  link: game.link || '#'
                });
              }}
              className={`p-2 rounded-full backdrop-blur-md border transition-all ${
                isFavorited 
                  ? 'text-black' 
                  : 'bg-black/40 border-white/10 text-white hover:text-accent opacity-0 group-hover:opacity-100'
              }`}
              style={{ 
                backgroundColor: isFavorited ? accentColor : 'rgba(0,0,0,0.4)',
                borderColor: isFavorited ? accentColor : 'rgba(255,255,255,0.1)'
              }}
            >
              <Star className={`w-3.5 h-3.5 ${isFavorited ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        <div>
          <div className="mb-1">
            <span className="text-[9px] font-black text-accent tracking-[0.2em] uppercase drop-shadow-md">{game.system}</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2 leading-tight group-hover:text-accent transition-colors">{game.title}</h3>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[9px] font-bold text-white/40 bg-white/5 px-2 py-0.5 rounded border border-white/5">{game.year}</span>
            <div className="h-px flex-1 bg-white/5"></div>
          </div>
          
          <button 
            onClick={() => handlePlayGame(game)}
            className="w-full py-3 bg-white/5 hover:bg-white text-white hover:text-black rounded-xl font-black text-[10px] tracking-[0.1em] transition-all flex items-center justify-center gap-2 border border-white/10 hover:border-white"
          >
            LAUNCH <Play className="w-3 h-3 fill-current" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

interface GameRailProps {
  key?: string | number;
  title: string;
  games: Game[];
  icon?: any;
  favorites: FavoriteItem[];
  onToggleFavorite: (item: FavoriteItem) => void;
  handlePlayGame: (game: Game) => void;
  customGames: Game[];
  handleDeleteCustomGame: (id: string) => void;
  featuredId: string;
  setFeaturedId: (id: string) => void;
  saveSettings: (updates: any) => void;
  accentColor: string;
}

const GameRail = ({ 
  title, 
  games, 
  icon: Icon, 
  favorites, 
  onToggleFavorite, 
  handlePlayGame, 
  customGames, 
  handleDeleteCustomGame, 
  featuredId, 
  setFeaturedId, 
  saveSettings, 
  accentColor 
}: GameRailProps) => {
  if (games.length === 0) return null;
  return (
    <div className="mb-16">
      <div className="flex items-center justify-between mb-6 px-4">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-5 h-5 text-accent" />}
          <h2 className="text-2xl font-black italic tracking-tight text-white uppercase">{title}</h2>
          <span className="text-[10px] font-bold text-neutral-600 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">{games.length}</span>
        </div>
        <div className="flex gap-2">
          <button className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-neutral-500 hover:text-white transition-all border border-white/5">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-neutral-500 hover:text-white transition-all border border-white/5">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex gap-6 overflow-x-auto pb-8 px-4 no-scrollbar scroll-smooth">
        {games.map(game => (
          <GameCard 
            key={game.id} 
            game={game} 
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
            handlePlayGame={handlePlayGame}
            isCustom={customGames.some(g => g.id === game.id)}
            handleDeleteCustomGame={handleDeleteCustomGame}
            featuredId={featuredId}
            setFeaturedId={setFeaturedId}
            saveSettings={saveSettings}
            accentColor={accentColor}
          />
        ))}
      </div>
    </div>
  );
};

export function GamesHub({ favorites, onToggleFavorite, setSelectedGame }: GamesHubProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentFilter, setCurrentFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'RAILS' | 'GRID'>('RAILS');
  const [recentlyPlayed, setRecentlyPlayed] = useState<string[]>([]);
  const [customGames, setCustomGames] = useState<Game[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Hub Customization State
  const [hubName, setHubName] = useState('GAMES');
  const [userName, setUserName] = useState('Commander');
  const [accentColor, setAccentColor] = useState('#ff0000'); // Default Red
  const [featuredId, setFeaturedId] = useState('sonic-adventure');
  const [hubBackground, setHubBackground] = useState('');

  const [newGame, setNewGame] = useState<Partial<Game>>({
    platform: 'PC',
    system: 'Web',
    year: new Date().getFullYear().toString(),
    color: 'from-red-600 to-red-900',
    icon: 'fa-gamepad',
    iconColor: 'text-white'
  });

  useEffect(() => {
    const savedRecent = localStorage.getItem('recently_played_games');
    if (savedRecent) setRecentlyPlayed(JSON.parse(savedRecent));

    const savedCustom = localStorage.getItem('custom_games_vault');
    if (savedCustom) setCustomGames(JSON.parse(savedCustom));

    const savedSettings = localStorage.getItem('hub_settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      if (settings.hubName) setHubName(settings.hubName);
      if (settings.userName) setUserName(settings.userName);
      if (settings.accentColor) setAccentColor(settings.accentColor);
      if (settings.featuredId) setFeaturedId(settings.featuredId);
      if (settings.hubBackground) setHubBackground(settings.hubBackground);
    }
  }, []);

  const saveSettings = (updates: any) => {
    const newSettings = { hubName, userName, accentColor, featuredId, hubBackground, ...updates };
    localStorage.setItem('hub_settings', JSON.stringify(newSettings));
  };

  const allGames = useMemo(() => [...INITIAL_GAMES, ...customGames], [customGames]);

  const handlePlayGame = (game: Game) => {
    setSelectedGame(game);
    const updated = [game.id, ...recentlyPlayed.filter(id => id !== game.id)].slice(0, 10);
    setRecentlyPlayed(updated);
    localStorage.setItem('recently_played_games', JSON.stringify(updated));
  };

  const handleAddGame = () => {
    if (!newGame.title || !newGame.id) return;
    const gameToAdd = { ...newGame } as Game;
    const updated = [...customGames, gameToAdd];
    setCustomGames(updated);
    localStorage.setItem('custom_games_vault', JSON.stringify(updated));
    setIsAddModalOpen(false);
    setNewGame({
      platform: 'PC',
      system: 'Web',
      year: new Date().getFullYear().toString(),
      color: 'from-blue-600 to-indigo-600',
      icon: 'fa-gamepad',
      iconColor: 'text-white'
    });
  };

  const handleDeleteCustomGame = (id: string) => {
    const updated = customGames.filter(g => g.id !== id);
    setCustomGames(updated);
    localStorage.setItem('custom_games_vault', JSON.stringify(updated));
    if (featuredId === id) setFeaturedId('sonic-adventure');
  };

  const filteredGames = useMemo(() => {
    return allGames.filter(game => {
      const searchLower = searchTerm.toLowerCase();
      const matchesPlatform = currentFilter === 'ALL' || game.platform === currentFilter;
      const matchesSearch = searchTerm === '' || 
        (game.title?.toLowerCase().includes(searchLower) || false) ||
        (game.desc?.toLowerCase().includes(searchLower) || false) ||
        (game.system?.toLowerCase().includes(searchLower) || false) ||
        (game.platform?.toLowerCase().includes(searchLower) || false) ||
        (game.year?.includes(searchLower) || false);
        
      return matchesPlatform && matchesSearch;
    });
  }, [searchTerm, currentFilter, allGames]);

  const featuredGame = useMemo(() => allGames.find(g => g.id === featuredId) || allGames[0], [allGames, featuredId]);

  const categories = useMemo(() => {
    const cats = ['Nintendo', 'Sega', 'PlayStation', 'PC'];
    return cats.map(cat => ({
      name: cat,
      games: allGames.filter(g => g.platform === cat)
    }));
  }, [allGames]);

  const recentGames = useMemo(() => {
    return recentlyPlayed.map(id => allGames.find(g => g.id === id)).filter(Boolean) as Game[];
  }, [recentlyPlayed, allGames]);

  const filterOptions = ['ALL', 'Nintendo', 'Sega', 'PlayStation', 'PC', 'Other'];

  return (
    <motion.div  
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#0a0a0a] pb-32"
      style={{ '--accent': accentColor } as React.CSSProperties}
    >
      {/* Hero Section */}
      <div className="relative h-[75vh] w-full overflow-hidden group">
        {hubBackground ? (
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-[20s] scale-110 group-hover:scale-100" 
            style={{ backgroundImage: `url('${hubBackground}')` }}
          />
        ) : (
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-[20s] scale-110 group-hover:scale-100" 
            style={{ backgroundImage: `url('${featuredGame.image}')` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a]/40 to-[#0a0a0a]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/20 to-transparent" />
        
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 z-10">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="max-w-3xl"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-accent tracking-[0.3em] uppercase mb-1">Welcome back,</span>
                <span className="text-2xl font-black italic text-white uppercase tracking-tighter">{userName}</span>
              </div>
              <div className="h-10 w-px bg-white/10 mx-2"></div>
              <div className="flex gap-6">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Games Size</span>
                  <span className="text-lg font-black text-white">{allGames.length}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Favorites</span>
                  <span className="text-lg font-black text-white">{favorites.length}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <span 
                className="px-3 py-1 text-black text-[10px] font-black uppercase tracking-widest rounded-full shadow-[0_0_20px_rgba(var(--accent-rgb),0.4)]"
                style={{ backgroundColor: accentColor }}
              >
                FEATURED TITLE
              </span>
              <span className="text-white/60 text-[10px] font-bold tracking-widest uppercase">{featuredGame.system} • {featuredGame.year}</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white mb-6 leading-none uppercase">
              {featuredGame.title}
            </h1>
            <p className="text-lg text-neutral-300 mb-8 leading-relaxed max-w-xl italic drop-shadow-lg">
              "{featuredGame.desc}"
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => handlePlayGame(featuredGame)}
                className="px-10 py-4 bg-white text-black rounded-2xl font-black text-xs tracking-[0.2em] transition-all hover:scale-105 active:scale-95 flex items-center gap-3 shadow-2xl"
              >
                PLAY NOW <Play className="w-4 h-4 fill-current" />
              </button>
              <button 
                onClick={() => onToggleFavorite({
                  id: featuredGame.id,
                  type: 'game',
                  title: featuredGame.title,
                  imageUrl: featuredGame.image || '',
                  link: featuredGame.link || '#'
                })}
                className="px-6 py-4 bg-white/10 backdrop-blur-xl border border-white/10 text-white rounded-2xl font-black text-xs tracking-[0.2em] transition-all hover:bg-white/20 flex items-center gap-3"
              >
                <Star className={`w-4 h-4 ${favorites.some(f => f.id === featuredGame.id) ? 'fill-current' : ''}`} style={{ color: favorites.some(f => f.id === featuredGame.id) ? accentColor : 'inherit' }} />
                FAVORITE
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="relative z-40 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 px-8 py-6 mb-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-4 mr-4">
              <h2 className="text-2xl font-black italic tracking-tighter text-white whitespace-nowrap uppercase">{hubName}</h2>
              <div className="h-8 w-px bg-white/10"></div>
            </div>
            <div className="relative w-full md:w-80 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 w-4 h-4 transition-colors group-focus-within:text-accent" />
              <input 
                type="text" 
                placeholder="Search games..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white py-3 pl-12 pr-6 rounded-xl outline-none focus:bg-white/10 transition-all font-sans text-sm font-medium placeholder:text-neutral-600"
                style={{ borderColor: searchTerm ? accentColor : 'rgba(255,255,255,0.1)' }}
              />
            </div>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="p-3 text-black rounded-xl hover:scale-105 transition-all shadow-lg"
              style={{ backgroundColor: accentColor }}
              title="Add Custom Game"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all"
              title="Hub Settings"
            >
              <Edit3 className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar w-full md:w-auto">
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
              <button 
                onClick={() => setViewMode('RAILS')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'RAILS' ? 'bg-white/10 text-white shadow-lg' : 'text-neutral-500 hover:text-white'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('GRID')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'GRID' ? 'bg-white/10 text-white shadow-lg' : 'text-neutral-500 hover:text-white'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
            <div className="h-6 w-px bg-white/10 hidden md:block"></div>
            {filterOptions.map(option => (
              <button
                key={option}
                onClick={() => setCurrentFilter(option)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                  currentFilter === option
                    ? 'text-black'
                    : 'border-white/5 bg-white/5 text-neutral-500 hover:text-white'
                }`}
                style={{ 
                  backgroundColor: currentFilter === option ? accentColor : 'transparent',
                  borderColor: currentFilter === option ? accentColor : 'rgba(255,255,255,0.05)'
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4">
        <AnimatePresence mode="wait">
          {searchTerm || currentFilter !== 'ALL' || viewMode === 'GRID' ? (
            <motion.div
              key="grid-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
            >
              {filteredGames.map(game => (
                <GameCard 
                  key={game.id} 
                  game={game} 
                  favorites={favorites}
                  onToggleFavorite={onToggleFavorite}
                  handlePlayGame={handlePlayGame}
                  isCustom={customGames.some(g => g.id === game.id)}
                  handleDeleteCustomGame={handleDeleteCustomGame}
                  featuredId={featuredId}
                  setFeaturedId={setFeaturedId}
                  saveSettings={saveSettings}
                  accentColor={accentColor}
                />
              ))}
              {filteredGames.length === 0 && (
                <div className="col-span-full py-32 text-center">
                  <Box className="w-16 h-16 text-neutral-700 mx-auto mb-6" />
                  <h3 className="text-2xl font-black italic text-white mb-2 uppercase tracking-tighter">Sector Empty</h3>
                  <p className="text-neutral-500 italic mb-8">"No matching signals found in the vault."</p>
                  <button 
                    onClick={() => { setSearchTerm(''); setCurrentFilter('ALL'); }}
                    className="px-8 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-black text-[10px] tracking-widest hover:bg-white hover:text-black transition-all"
                  >
                    RESET FILTERS
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="rails-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <GameRail 
                title="Recently Played" 
                games={recentGames} 
                icon={History} 
                favorites={favorites}
                onToggleFavorite={onToggleFavorite}
                handlePlayGame={handlePlayGame}
                customGames={customGames}
                handleDeleteCustomGame={handleDeleteCustomGame}
                featuredId={featuredId}
                setFeaturedId={setFeaturedId}
                saveSettings={saveSettings}
                accentColor={accentColor}
              />
              {customGames.length > 0 && (
                <GameRail 
                  title="Your Custom Games" 
                  games={customGames} 
                  icon={Box} 
                  favorites={favorites}
                  onToggleFavorite={onToggleFavorite}
                  handlePlayGame={handlePlayGame}
                  customGames={customGames}
                  handleDeleteCustomGame={handleDeleteCustomGame}
                  featuredId={featuredId}
                  setFeaturedId={setFeaturedId}
                  saveSettings={saveSettings}
                  accentColor={accentColor}
                />
              )}
              <GameRail 
                title="Trending Now" 
                games={INITIAL_GAMES.slice(0, 8)} 
                icon={Flame} 
                favorites={favorites}
                onToggleFavorite={onToggleFavorite}
                handlePlayGame={handlePlayGame}
                customGames={customGames}
                handleDeleteCustomGame={handleDeleteCustomGame}
                featuredId={featuredId}
                setFeaturedId={setFeaturedId}
                saveSettings={saveSettings}
                accentColor={accentColor}
              />
              {categories.map(cat => (
                <GameRail 
                  key={cat.name} 
                  title={cat.name} 
                  games={cat.games} 
                  favorites={favorites}
                  onToggleFavorite={onToggleFavorite}
                  handlePlayGame={handlePlayGame}
                  customGames={customGames}
                  handleDeleteCustomGame={handleDeleteCustomGame}
                  featuredId={featuredId}
                  setFeaturedId={setFeaturedId}
                  saveSettings={saveSettings}
                  accentColor={accentColor}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Game Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#121212] border border-white/10 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                <h2 className="text-xl font-black italic uppercase tracking-widest text-white">Add Custom Signal</h2>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-neutral-500 hover:text-white transition-colors">
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Game ID (Unique)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. my-cool-game"
                      value={newGame.id || ''}
                      onChange={e => setNewGame({...newGame, id: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-accent transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Title</label>
                    <input 
                      type="text" 
                      placeholder="Game Title"
                      value={newGame.title || ''}
                      onChange={e => setNewGame({...newGame, title: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-accent transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Platform</label>
                    <select 
                      value={newGame.platform}
                      onChange={e => setNewGame({...newGame, platform: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-accent transition-all"
                    >
                      <option value="Nintendo">Nintendo</option>
                      <option value="Sega">Sega</option>
                      <option value="PlayStation">PlayStation</option>
                      <option value="PC">PC</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">System</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Web, Windows, PS5"
                      value={newGame.system || ''}
                      onChange={e => setNewGame({...newGame, system: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-accent transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Image URL</label>
                  <input 
                    type="text" 
                    placeholder="https://..."
                    value={newGame.image || ''}
                    onChange={e => setNewGame({...newGame, image: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-accent transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Description</label>
                  <textarea 
                    placeholder="Short description..."
                    value={newGame.desc || ''}
                    onChange={e => setNewGame({...newGame, desc: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-accent transition-all h-24 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Theme Color (Tailwind from-to)</label>
                    <input 
                      type="text" 
                      placeholder="from-blue-600 to-indigo-600"
                      value={newGame.color || ''}
                      onChange={e => setNewGame({...newGame, color: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-accent transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Year</label>
                    <input 
                      type="text" 
                      placeholder="2024"
                      value={newGame.year || ''}
                      onChange={e => setNewGame({...newGame, year: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-accent transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white/5 border-t border-white/5 flex gap-4">
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 border border-white/10 text-neutral-400 rounded-xl font-bold hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddGame}
                  disabled={!newGame.title || !newGame.id}
                  className="flex-1 py-3 bg-accent text-black rounded-xl font-black uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  Add to Games
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#121212] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                <h2 className="text-xl font-black italic uppercase tracking-widest text-white">Hub Configuration</h2>
                <button onClick={() => setIsSettingsOpen(false)} className="p-2 text-neutral-500 hover:text-white transition-colors">
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Hub Identity</label>
                    <input 
                      type="text" 
                      value={hubName}
                      onChange={e => { setHubName(e.target.value); saveSettings({ hubName: e.target.value }); }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-black italic uppercase outline-none focus:border-accent transition-all"
                      placeholder="e.g. GAMES"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">User Handle</label>
                    <input 
                      type="text" 
                      value={userName}
                      onChange={e => { setUserName(e.target.value); saveSettings({ userName: e.target.value }); }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-black italic uppercase outline-none focus:border-accent transition-all"
                      placeholder="e.g. Commander"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Hub Background URL</label>
                  <input 
                    type="text" 
                    value={hubBackground}
                    onChange={e => { setHubBackground(e.target.value); saveSettings({ hubBackground: e.target.value }); }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-accent transition-all"
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Accent Signature</label>
                  <div className="flex flex-wrap gap-3">
                    {['#ff0000', '#FF3366', '#00FFCC', '#9933FF', '#FF6600', '#FFFFFF'].map(color => (
                      <button
                        key={color}
                        onClick={() => { setAccentColor(color); saveSettings({ accentColor: color }); }}
                        className={`w-10 h-10 rounded-full border-2 transition-all ${accentColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <input 
                      type="color" 
                      value={accentColor}
                      onChange={e => { setAccentColor(e.target.value); saveSettings({ accentColor: e.target.value }); }}
                      className="w-10 h-10 rounded-full bg-transparent border-none cursor-pointer overflow-hidden"
                    />
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3 text-neutral-400">
                    <History className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Local Persistence Active</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white/5 border-t border-white/5">
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-full py-4 bg-white text-black rounded-xl font-black uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                >
                  SAVE CONFIGURATION <Save className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
