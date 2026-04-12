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
import yt from 'yt-stream';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// In-memory chat store
const chatMessages: any[] = [];
const MAX_CHAT_HISTORY = 100;

app.get('/api/chat/messages', (req, res) => {
  console.log('[API] GET /api/chat/messages');
  res.json(chatMessages);
});

app.post('/api/chat/messages', (req, res) => {
  console.log('[API] POST /api/chat/messages', req.body);
  const message = req.body;
  if (!message || !message.text) {
    return res.status(400).json({ error: 'Invalid message' });
  }

  const newMessage = {
    ...message,
    id: message.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: message.createdAt || new Date().toISOString()
  };

  chatMessages.push(newMessage);
  if (chatMessages.length > MAX_CHAT_HISTORY) {
    chatMessages.shift();
  }

  res.status(201).json(newMessage);
});

// GA4 Proxy Route
app.get('/api/analytics/data', async (req, res) => {
  console.log('Received request for /api/analytics/data');
  try {
    const propertyId = '527976762'; // From the URL
    if (!process.env.GA4_SERVICE_ACCOUNT_JSON) {
        console.error('GA4 credentials not configured');
        return res.status(500).json({ error: 'GA4 credentials not configured' });
    }
    const analyticsDataClient = new BetaAnalyticsDataClient({
        credentials: JSON.parse(process.env.GA4_SERVICE_ACCOUNT_JSON)
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

// Music Proxy Routes
const MONOCHROME_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Referer': 'https://monochrome.tf/'
};

app.get('/api/music/monochrome/search', async (req, res) => {
  console.log(`[API] Music search request received: "${req.query.s}"`);
  try {
    const query = req.query.s as string;
    if (!query) return res.status(400).json({ error: 'Query required' });
    
    const monochromeMirrors = [
      `https://api.monochrome.tf/search/?s=${encodeURIComponent(query)}`,
      `https://api.monochrome.tf/search?s=${encodeURIComponent(query)}`,
      `https://api.monochrome.tf/v1/search?query=${encodeURIComponent(query)}`,
      `https://monochrome.tf/api/search?s=${encodeURIComponent(query)}`,
      `https://monochrome.tf/search/?s=${encodeURIComponent(query)}`
    ];

    let lastError = null;

    for (const url of monochromeMirrors) {
      try {
        console.log(`Trying Monochrome mirror: ${url}`);
        const response = await axios.get(url, { 
          headers: MONOCHROME_HEADERS,
          timeout: 5000,
          validateStatus: (status) => status === 200
        });

        const contentType = response.headers['content-type'] || '';
        if (contentType.includes('application/json')) {
          console.log('Monochrome search success');
          return res.json(response.data);
        }
      } catch (e: any) {
        lastError = e;
        console.debug(`Monochrome mirror attempt failed: ${url}. Error: ${e.message}`);
      }
    }

    res.status(503).json({ 
      error: 'Monochrome music search API failed', 
      details: lastError?.message || 'Service Unavailable' 
    });
  } catch (error) {
    console.error('Music search proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch music' });
  }
});

app.get('/api/music/monochrome/track/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const quality = req.query.quality || 'HIGH';
    
    const monochromeTrackMirrors = [
      `https://ohio.monochrome.tf/track/?id=${id}&quality=${quality}`,
      `https://virginia.monochrome.tf/track/?id=${id}&quality=${quality}`,
      `https://frankfurt.monochrome.tf/track/?id=${id}&quality=${quality}`,
      `https://api.monochrome.tf/track/?id=${id}&quality=${quality}`,
      `https://api.monochrome.tf/track?id=${id}&quality=${quality}`,
      `https://api.monochrome.tf/v1/track?id=${id}&quality=${quality}`,
      `https://monochrome.tf/api/track?id=${id}&quality=${quality}`
    ];

    for (const url of monochromeTrackMirrors) {
      try {
        console.log(`Trying Monochrome track mirror: ${url}`);
        const response = await axios.get(url, { 
          headers: MONOCHROME_HEADERS,
          timeout: 5000,
          validateStatus: (status) => status === 200
        });
        
        const contentType = response.headers['content-type'] || '';
        if (contentType.includes('application/json')) {
          console.log('Monochrome track success');
          return res.json(response.data);
        }
      } catch (e: any) {
        console.debug(`Monochrome track mirror attempt failed: ${url}. Error: ${e.message}`);
      }
    }

    res.status(503).json({ error: 'Failed to fetch track details from Monochrome' });
  } catch (error) {
    console.error('Track proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch track details' });
  }
});

// Session configuration for iframe compatibility
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    sameSite: 'none',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));


// Web Proxy Route removed


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
    // In production, serve static files from dist
    app.use(express.static('dist'));
    // Catch-all for SPA in production
    app.get('*all', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
