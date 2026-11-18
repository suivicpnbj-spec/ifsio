const express = require('express');
const path = require('node:path');
const { pool } = require('../db');
const { authenticate, requireRole } = require('../auth');
const router = express.Router();

router.use(authenticate, requireRole('student'));
router.get('/dashboard', async (req, res, next) => {
  try {
    const [news, resources, courses, events] = await Promise.all([
      pool.query(`SELECT id,kind,title,summary,category,published_at FROM portal_content WHERE status='published' AND ((kind='news' AND audience IN ('public','students')) OR (kind='page' AND audience='students')) ORDER BY published_at DESC LIMIT 8`),
      pool.query(`SELECT r.id,r.title,r.description,r.category,r.original_name,r.size_bytes,r.created_at,r.course_id,c.title AS course_title FROM portal_resource r LEFT JOIN portal_course c ON c.id=r.course_id WHERE r.status='published' AND r.audience IN ('public','students') AND (r.course_id IS NULL OR (c.filiere=$1 AND c.niveau=$2 AND c.annee_academique=$3)) ORDER BY r.created_at DESC LIMIT 60`, [req.user.filiere,req.user.niveau,req.user.annee_academique]),
      pool.query(`SELECT id,code,title,description,filiere,niveau,annee_academique FROM portal_course WHERE filiere=$1 AND niveau=$2 AND annee_academique=$3 ORDER BY title`, [req.user.filiere,req.user.niveau,req.user.annee_academique]),
      pool.query(`SELECT id,title,description,starts_at,ends_at,location FROM portal_event WHERE status='published' AND audience IN ('public','students') AND starts_at >= now() ORDER BY starts_at LIMIT 30`),
    ]);
    const { password_hash, ...student } = req.user;
    res.json({ student, news: news.rows, resources: resources.rows, courses:courses.rows, events:events.rows });
  } catch (error) { next(error); }
});
router.get('/resources/:id/download', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT r.original_name,r.stored_name FROM portal_resource r LEFT JOIN portal_course c ON c.id=r.course_id WHERE r.id=$1 AND r.status='published' AND r.audience IN ('public','students') AND (r.course_id IS NULL OR (c.filiere=$2 AND c.niveau=$3 AND c.annee_academique=$4))`, [req.params.id,req.user.filiere,req.user.niveau,req.user.annee_academique]);
    if (!rows[0]) return res.status(404).json({ error: 'Ressource introuvable.' });
    const directory = path.resolve(process.env.UPLOAD_DIR || './uploads');
    res.download(path.join(directory, rows[0].stored_name), rows[0].original_name, (err) => { if (err && !res.headersSent) next(err); });
  } catch (error) { next(error); }
});
module.exports = router;
