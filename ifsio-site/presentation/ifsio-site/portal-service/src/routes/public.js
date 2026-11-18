const express = require('express');
const path = require('node:path');
const { pool } = require('../db');
const router = express.Router();

router.get('/news', async (req, res, next) => {
  try {
    const category = String(req.query.category || '').trim().slice(0, 100) || null;
    const { rows } = await pool.query(`SELECT id,slug,title,summary,body,category,published_at,cover_file FROM portal_content WHERE kind='news' AND status='published' AND audience='public' AND ($1::text IS NULL OR category=$1) ORDER BY published_at DESC LIMIT 50`, [category]);
    res.json({ news: rows.map(({ cover_file, ...item }) => ({ ...item, cover_url: cover_file ? `/api/public/media/${encodeURIComponent(cover_file)}` : '' })) });
  } catch (error) { next(error); }
});
router.get('/news/:slug', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT slug,title,summary,body,category,published_at,cover_file FROM portal_content WHERE kind='news' AND status='published' AND audience='public' AND slug=$1`, [req.params.slug]);
    if (!rows[0]) return res.status(404).json({ error: 'Article introuvable.' });
    const { cover_file, ...article } = rows[0];
    res.json({ article: { ...article, cover_url: cover_file ? `/api/public/media/${encodeURIComponent(cover_file)}` : '' } });
  } catch (error) { next(error); }
});
router.get('/media/:filename', async (req, res, next) => {
  try {
    const filename = String(req.params.filename || '');
    if (!/^[0-9a-f-]{36}\.(?:jpg|jpeg|png|webp)$/i.test(filename)) return res.status(404).end();
    const { rows } = await pool.query(`SELECT 1 FROM portal_content WHERE cover_file=$1 AND kind IN ('news','page') AND status='published' AND audience='public' LIMIT 1`, [filename]);
    if (!rows[0]) return res.status(404).end();
    const filePath = path.join(path.resolve(process.env.UPLOAD_DIR || './uploads'), filename);
    res.type(path.extname(filename));
    res.set('Cache-Control', 'public, max-age=3600');
    res.sendFile(filePath, (error) => { if (error && !res.headersSent) next(error); });
  } catch (error) { next(error); }
});
router.get('/events', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT id,title,description,starts_at,ends_at,location FROM portal_event WHERE status='published' AND audience='public' AND starts_at >= now() ORDER BY starts_at LIMIT 50`);
    res.json({ events: rows });
  } catch (error) { next(error); }
});
router.get('/search', async (req, res, next) => {
  try {
    const term = String(req.query.q || '').trim().slice(0, 120);
    if (term.length < 2) return res.json({ query: term, results: [] });
    const pattern = `%${term.replace(/[\\%_]/g, '\\$&')}%`;
    const [content, resources, events] = await Promise.all([
      pool.query(`SELECT id,kind,title,summary,category,slug,published_at AS date FROM portal_content WHERE status='published' AND audience='public' AND (title ILIKE $1 OR summary ILIKE $1 OR body ILIKE $1 OR category ILIKE $1) ORDER BY published_at DESC LIMIT 30`, [pattern]),
      pool.query(`SELECT id,title,description AS summary,category,created_at AS date FROM portal_resource WHERE status='published' AND audience='public' AND (title ILIKE $1 OR description ILIKE $1 OR category ILIKE $1) ORDER BY created_at DESC LIMIT 20`, [pattern]),
      pool.query(`SELECT id,title,description AS summary,location,starts_at AS date FROM portal_event WHERE status='published' AND audience='public' AND starts_at >= now() AND (title ILIKE $1 OR description ILIKE $1 OR location ILIKE $1) ORDER BY starts_at LIMIT 20`, [pattern]),
    ]);
    const results = [
      ...content.rows.map((item) => ({ ...item, type: item.kind, url: `/page.html?view=contenu&slug=${encodeURIComponent(item.slug)}` })),
      ...resources.rows.map((item) => ({ ...item, type: 'resource', url: `/api/public/resources/${encodeURIComponent(item.id)}/download` })),
      ...events.rows.map((item) => ({ ...item, type: 'event', url: '/page.html?view=activites' })),
    ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 40);
    res.json({ query: term, results });
  } catch (error) { next(error); }
});
router.get('/pages/:slug', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT slug,title,summary,body,category,updated_at,cover_file FROM portal_content WHERE kind='page' AND status='published' AND audience='public' AND slug=$1`, [req.params.slug]);
    if (!rows[0]) return res.status(404).json({ error: 'Page introuvable.' });
    const { cover_file, ...page } = rows[0];
    res.json({ page: { ...page, cover_url: cover_file ? `/api/public/media/${encodeURIComponent(cover_file)}` : '' } });
  } catch (error) { next(error); }
});
router.get('/resources', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT id,title,description,category,original_name,size_bytes,created_at FROM portal_resource WHERE audience='public' AND status='published' ORDER BY created_at DESC LIMIT 100`);
    res.json({ resources: rows });
  } catch (error) { next(error); }
});
router.get('/resources/:id/download', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT original_name,stored_name FROM portal_resource WHERE id=$1 AND audience='public' AND status='published'`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Ressource introuvable.' });
    const directory = require('node:path').resolve(process.env.UPLOAD_DIR || './uploads');
    res.download(require('node:path').join(directory, rows[0].stored_name), rows[0].original_name, (err) => { if (err && !res.headersSent) next(err); });
  } catch (error) { next(error); }
});
module.exports = router;
