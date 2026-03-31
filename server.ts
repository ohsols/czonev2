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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(cookieParser());

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
app.get('/api/music/search', async (req, res) => {
  try {
    const query = req.query.q as string;
    if (!query) return res.status(400).json({ error: 'Query required' });
    
    // Try saavn.dev API first as it's more reliable
    try {
      const response = await fetch(`https://saavn.dev/api/search/songs?query=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        return res.json(data);
      }
    } catch (e) {
      console.error('saavn.dev API failed, trying backup...');
    }

    // Try primary API (jiosaavn-api.vercel.app)
    try {
      const response = await fetch(`https://jiosaavn-api.vercel.app/search?query=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        return res.json(data);
      }
    } catch (e) {
      console.error('jiosaavn-api.vercel.app API failed');
    }

    res.status(500).json({ error: 'All APIs failed' });
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch music' });
  }
});

app.get('/api/music/songs/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'ID required' });

    // Try saavn.dev API first
    try {
      const response = await fetch(`https://saavn.dev/api/songs/${id}`);
      if (response.ok) {
        const data = await response.json();
        return res.json(data);
      }
    } catch (e) {
      console.error('saavn.dev API failed, trying backup...');
    }

    // Try primary API (jiosaavn-api.vercel.app)
    try {
      const response = await fetch(`https://jiosaavn-api.vercel.app/song?id=${id}`);
      if (response.ok) {
        const data = await response.json();
        return res.json(data);
      }
    } catch (e) {
      console.error('jiosaavn-api.vercel.app API failed');
    }

    res.status(500).json({ error: 'All APIs failed' });
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch song details' });
  }
});

app.get('/api/music/monochrome/search', async (req, res) => {
  try {
    const query = req.query.s as string;
    if (!query) return res.status(400).json({ error: 'Query required' });
    
    const response = await fetch(`https://api.monochrome.tf/search?s=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Referer': 'https://monochrome.tf/'
      }
    });
    
    if (!response.ok) {
      return res.status(response.status).json({ error: `Monochrome search failed: ${response.status}` });
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Monochrome search proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch monochrome search' });
  }
});

app.get('/api/music/monochrome/track/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const quality = req.query.quality || 'HIGH';
    
    const response = await fetch(`https://api.monochrome.tf/track?id=${id}&quality=${quality}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Referer': 'https://monochrome.tf/'
      }
    });
    
    if (!response.ok) {
      return res.status(response.status).json({ error: `Monochrome track failed: ${response.status}` });
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Monochrome track proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch monochrome track' });
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
