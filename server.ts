import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Music Proxy Routes
app.get('/api/music/search', async (req, res) => {
  try {
    const query = req.query.q as string;
    if (!query) return res.status(400).json({ error: 'Query required' });
    
    // Try primary API (jiosaavn-api.vercel.app)
    try {
      const response = await fetch(`https://jiosaavn-api.vercel.app/search?query=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        return res.json(data);
      }
    } catch (e) {
      console.error('Primary API failed, trying backup...');
    }

    // Try backup API (saavn.dev)
    try {
      const response = await fetch(`https://saavn.dev/api/search/songs?query=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        return res.json(data);
      }
    } catch (e) {
      console.error('Backup API failed');
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

    // Try primary API (jiosaavn-api.vercel.app)
    try {
      const response = await fetch(`https://jiosaavn-api.vercel.app/song?id=${id}`);
      if (response.ok) {
        const data = await response.json();
        return res.json(data);
      }
    } catch (e) {
      console.error('Primary API failed, trying backup...');
    }

    // Try backup API (saavn.dev)
    try {
      const response = await fetch(`https://saavn.dev/api/songs/${id}`);
      if (response.ok) {
        const data = await response.json();
        return res.json(data);
      }
    } catch (e) {
      console.error('Backup API failed');
    }

    res.status(500).json({ error: 'All APIs failed' });
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch song details' });
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
