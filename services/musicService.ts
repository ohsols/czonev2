import { Category } from '../types';

export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  thumbnail: string | null;
  source: 'tidal' | 'soundcloud' | 'youtube';
  useBackend: boolean;
}

export async function searchMusic(query: string, source: string = 'all'): Promise<Track[]> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(`/api/music/monochrome/search?s=${encodedQuery}`);
    
    if (!response.ok) {
       console.warn('Monochrome search failed with status:', response.status);
       throw new Error('Monochrome search failed');
    }
    
    const data = await response.json();
    
    // Check if result is empty or error-like
    if (!Array.isArray(data) || data.length === 0) {
       throw new Error('No results from Monochrome');
    }
    
    return data.map((item: any) => {
      let thumbnailUrl = item.thumbnail || null;
      if (!thumbnailUrl && item.album?.cover) {
        thumbnailUrl = `https://resources.tidal.com/images/${item.album.cover.replace(/-/g, '/')}/320x320.jpg`;
      }

      return {
        id: item.id?.toString() || '',
        title: item.title || 'Unknown Title',
        artist: item.artist?.name || item.artist || 'Unknown Artist',
        duration: item.duration || 0,
        thumbnail: thumbnailUrl,
        source: 'tidal' as const,
        useBackend: true
      };
    });
  } catch (error) {
    console.warn('Primary search failed, trying fallback:', error);
    try {
      const fbResponse = await fetch(`/api/music/youtube/search?q=${encodeURIComponent(query)}`);
      if (!fbResponse.ok) return [];
      const fbData = await fbResponse.json();
      return fbData.map((item: any) => ({
        ...item,
        useBackend: false 
      }));
    } catch (fbError) {
      console.error('Fallback search failed:', fbError);
      return [];
    }
  }
}

export function getStreamUrl(track: Track): string {
  if (track.source === 'youtube') {
    return `/api/music/youtube/stream/${track.id}`;
  }
  // Use monochrome proxy for streaming
  return `/api/music/monochrome/stream/${track.id}`;
}
