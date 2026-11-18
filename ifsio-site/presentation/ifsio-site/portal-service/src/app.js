const path = require('node:path');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const adminRoutes = require('./routes/admin');
const publicRoutes = require('./routes/public');

const app = express();
app.disable('x-powered-by');
const cspDefaults = helmet.contentSecurityPolicy.getDefaultDirectives();
// En local, le site est servi en HTTP sur le réseau privé. Cette directive
// ferait réécrire les liens CSS/JS en HTTPS par les navigateurs des téléphones.
if (process.env.NODE_ENV !== 'production') delete cspDefaults['upgrade-insecure-requests'];
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      ...cspDefaults,
      'script-src': ["'self'", 'https://fonts.googleapis.com'],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
      'img-src': ["'self'", 'data:', 'https:'],
      'connect-src': ["'self'"],
    },
  },
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '64kb', parameterLimit: 40 }));
app.use(cookieParser());
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false }));
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);
app.get('/api/health', async (_req, res) => {
  try { await require('./db').pool.query('SELECT 1'); res.json({ ok: true, service: 'ifsio-portal', database: 'ok' }); }
  catch { res.status(503).json({ ok: false, service: 'ifsio-portal', database: 'unavailable' }); }
});

const siteRoot = path.resolve(__dirname, '../../refonte');
app.use(express.static(siteRoot, { extensions: ['html'], maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0 }));
app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Route introuvable.' });
  res.status(404).sendFile(path.join(siteRoot, '404.html'), (err) => { if (err && !res.headersSent) res.status(404).send('Page introuvable.'); });
});
app.use((err, req, res, _next) => {
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'Fichier trop volumineux.' });
  if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.message === 'TYPE_FILE_REFUSE') return res.status(400).json({ error: 'Format de fichier non autorisé.' });
  if (err.code === '23505') return res.status(409).json({ error: 'Cette adresse, ce matricule ou cet identifiant est déjà utilisé.' });
  console.error('[http]', err.message);
  res.status(err.status || 500).json({ error: err.status && err.status < 500 ? err.message : 'Une erreur interne est survenue.' });
});

module.exports = app;
