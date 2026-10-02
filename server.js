import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Serve static assets from the Vite build output directory
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Also serve the public directory for standalone diep_enhanced.html
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// Health check endpoint for Render.com zero-downtime monitoring
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// Single-page application (SPA) fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`🚀 Diep.io Server running on http://${HOST}:${PORT}`);
  console.log(`🎮 Standalone version available at http://${HOST}:${PORT}/diep_enhanced.html`);
});
