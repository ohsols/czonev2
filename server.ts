import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import YTMusic from 'ytmusic-api';
import multer from 'multer';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

dotenv.config();

const app = express();
const PORT = 3000;

const ytmusic = new YTMusic();
let isYTMusicInitialized = false;

async function initYTMusic() {
  if (!isYTMusicInitialized) {
    await ytmusic.initialize();
    isYTMusicInitialized = true;
  }
}

app.set('trust proxy', 1);

// In-memory store
const MAX_HISTORY = 3000;

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Request logger
app.use((req, res, next) => {
  const isAsset = req.url.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|otf|map|tsx|ts|jsx|json)$/);
  const isApi = req.url.startsWith('/api');
  
  if (isApi) {
    console.log(`[Server] ${new Date().toISOString()} API REQUEST: ${req.method} ${req.url}`);
  } else if (!isAsset && req.url !== '/' && !req.url.startsWith('/@')) {
    console.log(`[Server] ${new Date().toISOString()} NAVIGATION: ${req.method} ${req.url}`);
  }
  next();
});

// --------------------------------------------------------------------------
// API ROUTES START
// --------------------------------------------------------------------------

// Health check
app.get('/api/health', (req, res) => {
  console.log('[Server] Health check requested');
  res.json({ status: 'ok', time: new Date().toISOString(), env: process.env.NODE_ENV });
});

import https from 'https';

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// Music Search
app.get('/api/music/search', async (req, res) => {
  const query = req.query.s as string;
  if (!query) return res.status(400).json({ error: 'Missing search query' });

  // List of Monochrome/Hi-Fi instances from the GitHub document
  const monoInstances = [
    'https://monochrome-api.samidy.com',
    'https://api.monochrome.tf',
    'https://hifi.geeked.wtf',
    'https://hund.qqdl.site',
    'https://katze.qqdl.site'
  ];

  for (const base of monoInstances) {
    try {
      console.log(`[Music] Searching Monochrome instance ${base} for: ${query}`);
      const response = await axios.get(`${base}/search/`, {
        params: { s: query, limit: 30 },
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
          'Referer': 'https://monochrome.tf/',
          'Origin': 'https://monochrome.tf'
        },
        timeout: 6000,
        httpsAgent: httpsAgent
      });
      
      if (response.status !== 200) continue;

      const items = response.data?.data?.items || [];
      if (!Array.isArray(items) || items.length === 0) continue;
      
      const mapped = items.map((s: any) => {
        let coverUrl = '';
        if (s.album?.cover) {
          const parts = s.album.cover.split('-');
          if (parts.length === 5) {
            coverUrl = `https://resources.tidal.com/images/${parts[0]}/${parts[1]}/${parts[2]}/${parts[3]}/${parts[4]}/640x640.jpg`;
          } else {
            coverUrl = `https://resources.tidal.com/images/${s.album.cover.replace(/-/g, '/')}/640x640.jpg`;
          }
        }

        return {
          id: s.id.toString(),
          title: s.title,
          artist: s.artist?.name || s.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
          thumb: coverUrl || '',
          duration: s.duration,
          source: 'monochrome'
        };
      });

      console.log(`[Music] Found ${mapped.length} results via ${base}`);
      return res.json(mapped);

    } catch (error: any) {
      console.warn(`[Music] Monochrome instance ${base} failed: ${error.message}`);
    }
  }

  // Final fallback to YTMusic if all Monochrome instances fail
  console.warn(`[Music] All Monochrome searches failed, using YTMusic fallback`);
  try {
    await initYTMusic();
    const songs = await ytmusic.searchSongs(query);
    const mapped = songs.map(song => ({
      id: song.videoId,
      title: song.name,
      artist: (song as any).artist?.name || (song as any).artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
      thumb: song.thumbnails[song.thumbnails.length - 1]?.url || '',
      duration: song.duration,
      source: 'youtube'
    }));
    res.json(mapped);
  } catch (fallbackError) {
    console.error('[Music] All search methods failed:', fallbackError);
    res.status(500).json({ error: 'Music search failed' });
  }
});

// Music Stream 
app.use('/api/music/stream', async (req, res) => {
  let id = req.query.id as string;
  if (!id) return res.status(400).json({ error: 'Missing track or video ID' });

  try {
    let videoId = id;

    // Handle Tidal IDs from monochrome by bridging to YouTube
    if (/^\d+$/.test(id)) {
      console.log(`[Music] Resolving Tidal ID via Monochrome mirrors: ${id}`);
      const infoInstances = [
        'https://monochrome-api.samidy.com',
        'https://api.monochrome.tf',
        'https://hifi.geeked.wtf'
      ];

      for (const base of infoInstances) {
        try {
          const infoRes = await axios.get(`${base}/info/?id=${id}`, {
            timeout: 5000,
            headers: { 'User-Agent': 'Mozilla/5.0' },
            httpsAgent: httpsAgent
          });
          
          const trackInfo = infoRes.data?.data;
          if (trackInfo) {
            console.log(`[Music] Bridging via ${base}: ${trackInfo.title} - ${trackInfo.artist.name}`);
            await initYTMusic();
            const ytResults = await ytmusic.searchSongs(`${trackInfo.title} ${trackInfo.artist.name}`);
            if (ytResults && ytResults.length > 0) {
              videoId = ytResults[0].videoId;
              console.log(`[Music] Resolved to YouTube video ID: ${videoId}`);
              break; // Success
            }
          }
        } catch (bridgeError: any) {
          console.warn(`[Music] Mirror ${base} failed to resolve ID ${id}: ${bridgeError.message}`);
        }
      }
    }

    console.log(`[Music] Fetching stream via Piped APIs for: ${videoId}`);
    // Expanded list of Piped instances for better redundancy
    const pipedInstances = [
      'https://pipedapi.tokhmi.xyz',
      'https://api.piped.projectsegfau.lt',
      'https://pipedapi.adminforge.de',
      'https://pipedapi.smnz.de',
      'https://pipedapi.moomoo.me',
      'https://pipedapi.rivo.cc',
      'https://api-piped.mha.fi',
      'https://pipedapi.sync.pablo.casa',
      'https://pipedapi.kavin.rocks',
      'https://piped-api.lunar.icu',
      'https://pipedapi.synced.org',
      'https://pipedapi.leptons.xyz'
    ];

    let streamData = null;
    let lastError = null;

    for (const apiBase of pipedInstances) {
      try {
        console.log(`[Music] Trying Piped instance: ${apiBase} for ${videoId}`);
        const response = await axios.get(`${apiBase}/streams/${videoId}`, {
          timeout: 6000, // Slightly tighter timeout to cycle through faster
          validateStatus: (status) => status === 200,
          httpsAgent: httpsAgent,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
          }
        });
        
        const jsonData = response.data;
        // Verify we actually got the expected JSON data
        if (jsonData && jsonData.audioStreams && Array.isArray(jsonData.audioStreams) && jsonData.audioStreams.length > 0) {
           streamData = jsonData;
           console.log(`[Music] Found stream via ${apiBase}`);
           break; 
        } else {
           console.warn(`[Music] Instance ${apiBase} returned invalid data format or no audio streams`);
           lastError = new Error('Invalid response or no audio streams');
        }
      } catch (err: any) {
        const status = err.response?.status;
        const msg = err.code === 'ECONNABORTED' ? 'Timeout' : (err.message || 'Unknown Error');
        console.log(`[Music] Instance ${apiBase} failed: ${status ? status : msg}`);
        lastError = err;
      }
    }

    if (!streamData) {
      console.error(`[Music] All stream proxies failed for ${videoId}. Last error:`, lastError?.message || lastError);
      return res.status(500).json({ 
        error: 'All streaming instances failed', 
        videoId,
        detail: lastError?.message || String(lastError)
      });
    }
    
    // Select highest bitrate audio stream
    const bestAudio = streamData.audioStreams.sort((a: any, b: any) => b.bitrate - a.bitrate)[0];
    if (bestAudio && bestAudio.url) {
      console.log(`[Music] Redirecting to direct audio source for: ${videoId}`);
      res.redirect(bestAudio.url);
    } else {
      res.status(500).json({ error: 'No valid audio streams found' });
    }

  } catch (error: any) {
    console.error('[Music] Stream extraction total failure:', error.message);
    res.status(500).json({ error: 'Internal streaming error' });
  }
});

app.post('/api/uploads', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const manifestPath = path.join(process.cwd(), 'uploads-manifest.json');
  let manifest = [];
  if (fs.existsSync(manifestPath)) {
    try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')); } catch(e) {}
  }
  const fileEntry = {
    id: req.file.filename,
    originalName: req.file.originalname,
    path: `/uploads/${req.file.filename}`,
    timestamp: Date.now(),
    title: req.body.title || req.file.originalname,
    type: req.body.type || 'unknown'
  };
  manifest.push(fileEntry);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  res.json(fileEntry);
});

app.post('/api/uploads/migrate', (req, res) => {
  const { legacyUploads } = req.body;
  if (!Array.isArray(legacyUploads)) return res.status(400).json({ error: 'Invalid data' });
  
  const manifestPath = path.join(process.cwd(), 'uploads-manifest.json');
  let manifest: any[] = [];
  if (fs.existsSync(manifestPath)) {
    try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')); } catch(e) {}
  }
  
  let addedCount = 0;
  for (const item of legacyUploads) {
    if (!manifest.find(m => m.id === item.id)) {
      manifest.push({
        id: item.id,
        title: item.title,
        type: item.type,
        path: item.driveLink || '',
        imageLink: item.imageLink || '',
        timestamp: item.createdAt?.seconds ? item.createdAt.seconds * 1000 : Date.now(),
        isLegacy: true
      });
      addedCount++;
    }
  }
  
  manifest.sort((a, b) => b.timestamp - a.timestamp);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  res.json({ success: true, count: addedCount });
});

app.get('/api/uploads', (req, res) => {
  const manifestPath = path.join(process.cwd(), 'uploads-manifest.json');
  if (!fs.existsSync(manifestPath)) return res.json([]);
  res.json(JSON.parse(fs.readFileSync(manifestPath, 'utf-8')));
});

app.delete('/api/uploads/:filename', (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    const manifestPath = path.join(process.cwd(), 'uploads-manifest.json');
    if (fs.existsSync(manifestPath)) {
      let manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      manifest = manifest.filter((entry: any) => entry.id !== req.params.filename);
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    }
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

app.use('/uploads', express.static(uploadDir));

// GA4 Proxy Route
app.get('/api/analytics/data', async (req, res) => {
  try {
    const propertyId = '527976762';
    if (!process.env.GA4_SERVICE_ACCOUNT_JSON) {
        return res.status(500).json({ error: 'GA4 credentials not configured' });
    }
    
    let credentials;
    try {
      credentials = JSON.parse(process.env.GA4_SERVICE_ACCOUNT_JSON);
    } catch (e) {
      return res.status(500).json({ error: 'Invalid GA4 credentials format' });
    }

    const analyticsDataClient = new BetaAnalyticsDataClient({
        credentials
    });

    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      metrics: [{ name: 'activeUsers' }],
      dimensions: [{ name: 'date' }],
    });

    res.json(response);
  } catch (error) {
    console.error('GA4 error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Final catch-all for unmatched API routes
app.all('/api/*all', (req, res) => {
  console.warn(`[Server] 404 NOT FOUND - API route match failed: ${req.method} ${req.url}`);
  res.status(404).json({ 
    error: 'API route not found', 
    method: req.method,
    path: req.url,
    timestamp: new Date().toISOString()
  });
});

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    sameSite: 'none',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  console.log(`Starting server in ${isProd ? 'production' : 'development'} mode...`);

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // SPA fallback - only for non-API routes
    app.get('*all', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        console.log(`[Server] API route fell through to SPA fallback: ${req.path}`);
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[Server Error]', err);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: err.message
    });
  });
}

startServer();
