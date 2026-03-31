import React, { useState, useRef, useEffect } from 'react';
import { Search, Play, Pause, SkipBack, SkipForward, Repeat, Volume2, Music, Loader2, RotateCcw, RotateCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Track {
  id: string | number;
  title: string;
  artist: string;
  album: string;
  cover: string;
  streamUrl?: string;
  source?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.02
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { duration: 0.2, ease: "easeOut" } }
};

const MusicPlayer: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrack = currentTrackIndex !== null ? tracks[currentTrackIndex] : null;

  const searchSongs = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      // Try monochrome proxy first
      let response = await fetch(`/api/music/monochrome/search?s=${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) {
        console.warn('Monochrome search failed, trying Saavn...');
        // Fallback to Saavn proxy
        response = await fetch(`/api/music/search?q=${encodeURIComponent(searchQuery)}`);
      }
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      let formattedTracks: Track[] = [];

      // Handle Monochrome response
      if (data.data && data.data.items) {
        formattedTracks = data.data.items.map((item: any) => ({
          id: item.id,
          title: item.title,
          artist: item.artist.name,
          album: item.album.title,
          cover: `https://resources.tidal.com/images/${item.album.cover.replace(/-/g, '/')}/640x640.jpg`,
          streamUrl: undefined,
          source: 'monochrome'
        }));
      } 
      // Handle Saavn response (jiosaavn-api.vercel.app or saavn.dev)
      else if (data.data && data.data.results) {
        formattedTracks = data.data.results.map((item: any) => ({
          id: item.id,
          title: item.name || item.title,
          artist: item.artists?.primary?.[0]?.name || item.artist || item.subtitle || 'Unknown Artist',
          album: item.album?.name || item.album || 'Unknown Album',
          cover: item.image?.[2]?.link || item.image?.[2]?.url || item.image?.[0]?.link || item.image || '',
          streamUrl: item.downloadUrl?.[4]?.link || item.downloadUrl?.[4]?.url || item.downloadUrl || undefined,
          source: 'saavn'
        }));
      } else if (Array.isArray(data)) {
         // Some Saavn APIs return array directly
         formattedTracks = data.map((item: any) => ({
          id: item.id,
          title: item.song || item.name || item.title,
          artist: item.singers || item.artist || item.subtitle || 'Unknown Artist',
          album: item.album || 'Unknown Album',
          cover: item.image,
          streamUrl: item.media_url || item.downloadUrl || undefined,
          source: 'saavn'
        }));
      } else if (data.results) {
        // Handle direct results array
        formattedTracks = data.results.map((item: any) => ({
          id: item.id,
          title: item.name || item.title,
          artist: item.artists?.primary?.[0]?.name || item.artist || item.subtitle || 'Unknown Artist',
          album: item.album?.name || item.album || 'Unknown Album',
          cover: item.image?.[2]?.link || item.image?.[2]?.url || item.image?.[0]?.link || item.image || '',
          streamUrl: item.downloadUrl?.[4]?.link || item.downloadUrl?.[4]?.url || item.downloadUrl || undefined,
          source: 'saavn'
        }));
      }

      setTracks(formattedTracks);
    } catch (error) {
      console.error('Error searching music:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStreamUrl = async (trackId: string | number, source: string = 'monochrome') => {
    try {
      if (source === 'saavn') {
        // For Saavn, we might already have the URL or we need to fetch it from our proxy
        const response = await fetch(`/api/music/songs/${trackId}`);
        if (response.ok) {
          const data = await response.json();
          const song = data.data?.[0] || data[0] || data;
          
          if (!song) return null;

          // Try different possible locations for the download URL
          if (Array.isArray(song.downloadUrl)) {
            // Try to get the highest quality (usually the last one)
            const highestQuality = song.downloadUrl[song.downloadUrl.length - 1];
            return highestQuality?.link || highestQuality?.url || null;
          }
          
          return song.downloadUrl || song.media_url || null;
        }
        return null;
      }

      // Monochrome logic
      const response = await fetch(`/api/music/monochrome/track/${trackId}?quality=HIGH`);
      if (!response.ok) {
        throw new Error(`Failed to fetch track info: ${response.status}`);
      }
      const data = await response.json();
      
      if (!data || !data.data || !data.data.manifest) {
        console.error('Invalid track data received:', data);
        return null;
      }

      try {
        const manifest = JSON.parse(atob(data.data.manifest));
        if (!manifest || !manifest.urls || manifest.urls.length === 0) {
          console.error('No stream URLs found in manifest:', manifest);
          return null;
        }
        
        return manifest.urls[0];
      } catch (e) {
        console.error('Error parsing manifest:', e);
        return null;
      }
    } catch (error) {
      console.error('Error fetching stream URL:', error);
      return null;
    }
  };

  const playTrack = async (index: number) => {
    const track = tracks[index];
    if (!track.streamUrl) {
      setIsLoading(true);
      const url = await fetchStreamUrl(track.id, (track as any).source);
      if (url) {
        const newTracks = [...tracks];
        newTracks[index] = { ...track, streamUrl: url };
        setTracks(newTracks);
        if (audioRef.current) {
            audioRef.current.src = url;
            audioRef.current.play().catch(e => console.error("Playback failed", e));
            setIsPlaying(true);
        }
      }
      setIsLoading(false);
    } else {
       if (audioRef.current) {
          audioRef.current.src = track.streamUrl;
          audioRef.current.play().catch(e => console.error("Playback failed", e));
          setIsPlaying(true);
       }
    }
    setCurrentTrackIndex(index);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const skipTime = (amount: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime += amount;
    }
  };

  const nextTrack = () => {
    if (tracks.length === 0 || currentTrackIndex === null) return;
    const nextIndex = (currentTrackIndex + 1) % tracks.length;
    playTrack(nextIndex);
  };

  const prevTrack = () => {
    if (tracks.length === 0 || currentTrackIndex === null) return;
    const prevIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    playTrack(prevIndex);
  };

  const handleEnded = () => {
    if (isRepeat) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else {
      nextTrack();
    }
  };

  // Effect to handle play/pause when isPlaying changes is not enough because we need to load src first
  // We handle src loading in playTrack. 
  
  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="p-4 md:p-8 max-w-6xl mx-auto space-y-8"
    >
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Player Section */}
        <div className="w-full md:w-1/3 space-y-6 sticky top-24">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="aspect-square w-full bg-black/40 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl border border-white/5 group relative"
          >
            <AnimatePresence mode="wait">
              {currentTrack ? (
                <motion.img 
                  key={currentTrack.id}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5 }}
                  src={currentTrack.cover} 
                  alt={currentTrack.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              ) : (
                <motion.div 
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full flex items-center justify-center text-[#1c1c1f]"
                >
                  <Music size={80} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <div className="space-y-4">
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-black text-white truncate">{currentTrack?.title || 'No Song Selected'}</h2>
              <p className="text-text-muted font-medium">{currentTrack?.artist || 'Search for music'}</p>
            </div>

            <div className="space-y-2">
              <input 
                type="range" 
                min="0" 
                max={duration || 0} 
                value={progress} 
                onChange={handleSeek}
                className="w-full h-1 bg-surface-hover rounded-lg appearance-none cursor-pointer accent-accent"
              />
              <div className="flex justify-between text-[10px] font-mono text-text-secondary uppercase tracking-widest">
                <span>{formatTime(progress)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-6">
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsRepeat(!isRepeat)}
                className={`transition-colors ${isRepeat ? 'text-accent' : 'text-text-secondary hover:text-white'}`}
                title="Repeat"
              >
                <Repeat size={20} />
              </motion.button>
              
              <div className="flex items-center gap-4">
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => skipTime(-10)}
                  className="text-text-secondary hover:text-white transition-colors"
                  title="-10s"
                >
                  <RotateCcw size={20} />
                </motion.button>
                
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={prevTrack}
                  className="text-white transition-transform"
                >
                  <SkipBack size={28} fill="currentColor" />
                </motion.button>

                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={togglePlay}
                  disabled={!currentTrack}
                  className="w-14 h-14 bg-accent text-white rounded-full flex items-center justify-center shadow-[0_0_20px_var(--accent-glow)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <AnimatePresence mode="wait">
                    {isPlaying ? (
                      <motion.div key="pause" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                        <Pause size={28} fill="currentColor" />
                      </motion.div>
                    ) : (
                      <motion.div key="play" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                        <Play size={28} fill="currentColor" className="ml-1" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>

                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={nextTrack}
                  className="text-white transition-transform"
                >
                  <SkipForward size={28} fill="currentColor" />
                </motion.button>

                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => skipTime(10)}
                  className="text-text-secondary hover:text-white transition-colors"
                  title="+10s"
                >
                  <RotateCw size={20} />
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Search & List Section */}
        <div className="flex-1 w-full space-y-6">
          <form onSubmit={searchSongs} className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-accent transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search for songs, artists, or albums..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg border border-surface-hover rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-accent transition-all placeholder:text-text-secondary"
            />
            {isLoading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Loader2 className="animate-spin text-accent" size={20} />
              </div>
            )}
          </form>

          <div className="bg-black/40 backdrop-blur-md border border-surface-hover rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-surface-hover flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted">Music Results</h3>
              <span className="text-[10px] font-mono text-text-secondary">{tracks.length} Tracks Found</span>
            </div>
            
            <div className="divide-y divide-surface-hover max-h-[600px] overflow-y-auto custom-scrollbar">
              <AnimatePresence mode="wait">
                {tracks.length > 0 ? (
                  <motion.div 
                    key="results"
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                  >
                    {tracks.map((track, index) => (
                      <motion.button
                        key={track.id}
                        variants={itemVariants}
                        onClick={() => playTrack(index)}
                        className={`w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors group ${currentTrackIndex === index ? 'bg-white/5' : ''}`}
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 relative">
                          <img src={track.cover} alt={track.title} className="w-full h-full object-cover" />
                          {currentTrackIndex === index && isPlaying && (
                            <div className="absolute inset-0 bg-bg/40 flex items-center justify-center">
                              <div className="flex gap-0.5 items-end h-4">
                                <div className="w-1 bg-accent animate-[music-bar_0.6s_ease-in-out_infinite]" />
                                <div className="w-1 bg-accent animate-[music-bar_0.8s_ease-in-out_infinite_0.1s]" />
                                <div className="w-1 bg-accent animate-[music-bar_0.7s_ease-in-out_infinite_0.2s]" />
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <h4 className={`font-bold truncate ${currentTrackIndex === index ? 'text-accent' : 'text-white'}`}>{track.title}</h4>
                          <p className="text-xs text-text-muted truncate">{track.artist} • {track.album}</p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play size={16} className="text-accent" fill="currentColor" />
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="p-20 text-center space-y-4"
                  >
                    <div className="w-20 h-20 bg-surface-hover rounded-full flex items-center justify-center mx-auto text-text-secondary">
                      <Search size={32} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-white font-bold">Search Music</p>
                      <p className="text-xs text-text-secondary">Find Your Favorite Tracks And Llisten Instantly</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <audio 
        ref={audioRef} 
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        className="hidden"
      />

      <style>{`
        @keyframes music-bar {
          0%, 100% { height: 4px; }
          50% { height: 16px; }
        }
      `}</style>
    </motion.div>
  );
};

export default MusicPlayer;
