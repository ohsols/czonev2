import { Category } from '../types';

export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  thumbnail: string | null;
  source: 'tidal' | 'soundcloud';
  useBackend: boolean;
}

export async function searchMusic(query: string, source: string = 'all'): Promise<Track[]> {
  try {
    const response = await fetch(`/api/music/infamous/tidal/search/${encodeURIComponent(query)}`);
    if (!response.ok) return [];
    
    const data = await response.json();
    
    // Infamous API returns an array of tracks directly
    return (Array.isArray(data) ? data : []).map((item: any) => {
      let thumbnailUrl = null;
      if (item.thumbnail) {
        if (item.thumbnail.startsWith('/api/music/cover?u=')) {
          try {
            const b64 = item.thumbnail.split('u=')[1];
            const realUrl = atob(b64);
            thumbnailUrl = `/api/music/infamous/image?url=${encodeURIComponent(realUrl)}`;
          } catch (e) {
            thumbnailUrl = `/api/music/infamous/image?url=${encodeURIComponent(`https://infamous.qzz.io${item.thumbnail}`)}`;
          }
        } else {
          thumbnailUrl = `/api/music/infamous/image?url=${encodeURIComponent(item.thumbnail)}`;
        }
      } else if (item.album?.cover) {
        const tidalUrl = `https://resources.tidal.com/images/${item.album.cover.replace(/-/g, '/')}/320x320.jpg`;
        thumbnailUrl = `/api/music/infamous/image?url=${encodeURIComponent(tidalUrl)}`;
      }

      return {
        id: item.id?.toString() || '',
        title: item.title || 'Unknown Title',
        artist: item.artist?.name || item.artist || 'Unknown Artist',
        duration: item.duration || 0,
        thumbnail: thumbnailUrl,
        source: 'tidal',
        useBackend: true
      };
    });
  } catch (error) {
    console.error('Search failed:', error);
    return [];
  }
}

export function getStreamUrl(track: Track): string {
  // Use infamous proxy for streaming
  return `/api/music/infamous/tidal/stream/${track.id}`;
}
