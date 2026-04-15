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
    const response = await fetch(`/api/music/monochrome/search?s=${encodeURIComponent(query)}`);
    if (!response.ok) return [];
    
    const responseData = await response.json();
    
    // Monochrome API returns an object with data.items or just items depending on the mirror
    let items = [];
    if (Array.isArray(responseData)) {
      items = responseData;
    } else if (responseData?.data?.items && Array.isArray(responseData.data.items)) {
      items = responseData.data.items;
    } else if (responseData?.items && Array.isArray(responseData.items)) {
      items = responseData.items;
    }
    
    return items.map((item: any) => ({
      id: item.id?.toString() || '',
      title: item.title || 'Unknown Title',
      artist: item.artist?.name || item.artist || 'Unknown Artist',
      duration: item.duration || 0,
      thumbnail: item.album?.cover ? `https://resources.tidal.com/images/${item.album.cover.replace(/-/g, '/')}/320x320.jpg` : null,
      source: 'tidal',
      useBackend: true
    }));
  } catch (error) {
    console.error('Search failed:', error);
    return [];
  }
}

export function getStreamUrl(track: Track): string {
  // We need to fetch the actual stream URL from the track endpoint
  // But for the audio element, we can use a proxy route that handles the redirect
  return `/api/music/monochrome/stream/${track.id}`;
}
