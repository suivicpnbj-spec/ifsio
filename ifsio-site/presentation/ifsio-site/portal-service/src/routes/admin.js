const express = require('express');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const multer = require('multer');
const { pool } = require('../db');
const { authenticate, requireRole, sameOrigin } = require('../auth');
const router = express.Router();
const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
fs.mkdirSync(uploadDir, { recursive: true, mode: 0o750 });
const maxBytes = (Number(process.env.MAX_UPLOAD_MB) || 15) * 1024 * 1024;
const allowedFiles = new Map([
  ['application/pdf', new Set(['.pdf'])],
  ['image/jpeg', new Set(['.jpg','.jpeg'])],
  ['image/png', new Set(['.png'])],
  ['image/webp', new Set(['.webp'])],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', new Set(['.docx'])],
  ['application/vnd.openxmlformats-officedocument.presentationml.presentation', new Set(['.pptx'])],
  ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', new Set(['.xlsx'])],
]);
const storage = multer.diskStorage({
  destination: (_req, _file, done) => done(null, uploadDir),
  filename: (_req, file, done) => done(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
});
const upload = multer({
  storage,
  limits: { fileSize: maxBytes, files: 1 },
  fileFilter: (_req, file, done) => {
    const ext = path.extname(file.originalname).toLowerCase();
    done(allowedFiles.get(file.mimetype)?.has(ext) ? null : new Error('TYPE_FILE_REFUSE'), Boolean(allowedFiles.get(file.mimetype)?.has(ext)));
  },
});
const slugify = (value) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 160) || crypto.randomUUID();
const validEnum = (value, allowed, fallback) => allowed.includes(value) ? value : fallback;
const validId = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

router.use(authenticate, requireRole('admin'));
router.use((req, res, next) => ['POST','PUT','PATCH','DELETE'].includes(req.method) ? sameOrigin(req,res,next) : next());

router.get('/overview', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT count(*)::int FROM portal_content) AS contents,
        (SELECT count(*)::int FROM portal_content WHERE status='published') AS published,
        (SELECT count(*)::int FROM portal_resource) AS resources,
        (SELECT count(*)::int FROM portal_user WHERE role='student' AND status='pending') AS pending_students`);
    res.json(rows[0]);
  } catch (error) { next(error); }
});

router.get('/students', async (req, res, next) => {
  try {
    const status = validEnum(req.query.status, ['pending','active','suspended'], null);
    const { rows } = await pool.query(
      `SELECT id,email,full_name,matricule,filiere,niveau,annee_academique,status,created_at
       FROM portal_user WHERE role='student' AND ($1::text IS NULL OR status=$1)
       ORDER BY created_at DESC LIMIT 200`, [status]);
    res.json({ students: rows });
  } catch (error) { next(error); }
});
router.patch('/students/:id/status', async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Identifiant invalide.' });
    const status = validEnum(req.body.status, ['active','suspended'], null);
    if (!status) return res.status(400).json({ error: 'Statut invalide.' });
    const { rows } = await pool.query(
      `UPDATE portal_user SET status=$1, approved_by=CASE WHEN $1='active' THEN $2 ELSE approved_by END,
       approved_at=CASE WHEN $1='active' THEN now() ELSE approved_at END, updated_at=now()
       WHERE id=$3 AND role='student' RETURNING id,email,full_name,matricule,status`,
      [status, req.user.id, req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Demande ou compte introuvable.' });
    res.json({ student: rows[0] });
  } catch (error) { next(error); }
});

router.get('/content', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM portal_content ORDER BY updated_at DESC LIMIT 500`);
    res.json({ content: rows });
  } catch (error) { next(error); }
});
router.get('/content/:id/cover', async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(404).end();
    const { rows } = await pool.query('SELECT cover_file FROM portal_content WHERE id=$1', [req.params.id]);
    if (!rows[0]?.cover_file || !/^[0-9a-f-]{36}\.(?:jpg|jpeg|png|webp)$/i.test(rows[0].cover_file)) return res.status(404).end();
    const filePath = path.join(uploadDir, rows[0].cover_file);
    res.type(path.extname(rows[0].cover_file));
    res.set('Cache-Control', 'private, max-age=300');
    res.sendFile(filePath, (error) => { if (error && !res.headersSent) next(error); });
  } catch (error) { next(error); }
});
router.post('/content', upload.single('cover'), async (req, res, next) => {
  try {
    const { title, summary='', body, category='', kind='news', audience='public', status='draft', slug } = req.body;
    if (!title?.trim() || title.trim().length > 240 || !body?.trim() || body.length > 100000) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: 'Le titre et le contenu sont requis (100 000 caractères maximum).' });
    }
    if (!['page','news'].includes(kind) || !['public','students'].includes(audience) || !['draft','published'].includes(status)) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: 'Paramètres de publication invalides.' });
    }
    if (req.file && !req.file.mimetype.startsWith('image/')) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: 'La couverture doit être une image JPG, PNG ou WEBP.' });
    }
    const safeSlug = slugify(String(slug || title).slice(0, 240));
    const { rows } = await pool.query(
      `INSERT INTO portal_content (kind,slug,title,summary,body,category,status,audience,created_by,published_at,cover_file)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,CASE WHEN $7='published' THEN now() END,$10) RETURNING *`,
      [kind,safeSlug,title.trim(),String(summary).slice(0,500),body.trim(),String(category).slice(0,100),status,audience,req.user.id,req.file?.filename||'']);
    res.status(201).json({ content: rows[0] });
  } catch (error) { if (req.file) fs.unlink(req.file.path, () => {}); next(error); }
});
router.put('/content/:id', upload.single('cover'), async (req, res, next) => {
  try {
    if (!validId(req.params.id)) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: 'Identifiant invalide.' });
    }
    const { title, summary='', body, category='', kind='news', audience='public', status='draft', slug } = req.body;
    if (!title?.trim() || title.trim().length > 240 || !body?.trim() || body.length > 100000) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: 'Le titre et le contenu sont requis (100 000 caractères maximum).' });
    }
    if (!['page','news'].includes(kind) || !['public','students'].includes(audience) || !['draft','published'].includes(status)) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: 'Paramètres de publication invalides.' });
    }
    if (req.file && !req.file.mimetype.startsWith('image/')) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: 'La couverture doit être une image JPG, PNG ou WEBP.' });
    }
    const previous = await pool.query('SELECT cover_file FROM portal_content WHERE id=$1', [req.params.id]);
    if (!previous.rows[0]) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(404).json({ error: 'Contenu introuvable.' });
    }
    const nextCover = req.file?.filename || (kind === 'news' ? previous.rows[0].cover_file : '');
    const { rows } = await pool.query(
      `UPDATE portal_content SET kind=$1,slug=$2,title=$3,summary=$4,body=$5,category=$6,status=$7,audience=$8,cover_file=$9,
       published_at=CASE WHEN $7='published' THEN COALESCE(published_at,now()) ELSE NULL END,updated_at=now()
       WHERE id=$10 RETURNING *`,
      [kind,slugify(String(slug || title).slice(0,240)),title.trim(),String(summary).slice(0,500),body.trim(),String(category).slice(0,100),status,audience,nextCover,req.params.id]);
    if (previous.rows[0].cover_file && previous.rows[0].cover_file !== nextCover) fs.unlink(path.join(uploadDir, previous.rows[0].cover_file), () => {});
    res.json({ content: rows[0] });
  } catch (error) { if (req.file) fs.unlink(req.file.path, () => {}); next(error); }
});
router.delete('/content/:id', async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Identifiant invalide.' });
    const result = await pool.query('DELETE FROM portal_content WHERE id=$1 RETURNING cover_file', [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Contenu introuvable.' });
    if (result.rows[0].cover_file) fs.unlink(path.join(uploadDir, result.rows[0].cover_file), () => {});
    res.status(204).end();
  } catch (error) { next(error); }
});


router.get('/courses', async (_req, res, next) => {
  try { const { rows } = await pool.query('SELECT * FROM portal_course ORDER BY filiere,niveau,title'); res.json({ courses: rows }); }
  catch (error) { next(error); }
});
router.post('/courses', async (req, res, next) => {
  try {
    const { code,title,description='',filiere,niveau,annee_academique } = req.body;
    if (!code?.trim() || !title?.trim() || !filiere?.trim() || !niveau?.trim() || !/^\d{4}-\d{4}$/.test(String(annee_academique||''))) return res.status(400).json({error:'Renseignez le code, le titre, la filière, le niveau et une année AAAA-AAAA.'});
    const { rows } = await pool.query(`INSERT INTO portal_course(code,title,description,filiere,niveau,annee_academique,created_by) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,[code.trim().slice(0,50),title.trim(),String(description).slice(0,1000),filiere.trim().slice(0,120),niveau.trim().slice(0,40),annee_academique,req.user.id]);
    res.status(201).json({course:rows[0]});
  } catch(error){next(error);}
});
router.put('/courses/:id', async (req,res,next)=>{
  try {
    if(!validId(req.params.id)) return res.status(400).json({error:'Identifiant invalide.'});
    const {code,title,description='',filiere,niveau,annee_academique}=req.body;
    if(!code?.trim()||!title?.trim()||!filiere?.trim()||!niveau?.trim()||!/^\d{4}-\d{4}$/.test(String(annee_academique||''))) return res.status(400).json({error:'Renseignez le code, le titre, la filière, le niveau et une année AAAA-AAAA.'});
    const {rows}=await pool.query(`UPDATE portal_course SET code=$1,title=$2,description=$3,filiere=$4,niveau=$5,annee_academique=$6,updated_at=now() WHERE id=$7 RETURNING *`,[code.trim().slice(0,50),title.trim(),String(description).slice(0,1000),filiere.trim().slice(0,120),niveau.trim().slice(0,40),annee_academique,req.params.id]);
    if(!rows[0]) return res.status(404).json({error:'Cours introuvable.'}); res.json({course:rows[0]});
  }catch(error){next(error);}
});
router.delete('/courses/:id',async(req,res,next)=>{
  try{if(!validId(req.params.id))return res.status(400).json({error:'Identifiant invalide.'});const result=await pool.query('DELETE FROM portal_course WHERE id=$1',[req.params.id]);if(!result.rowCount)return res.status(404).json({error:'Cours introuvable.'});res.status(204).end();}
  catch(error){next(error);}
});

router.get('/events',async(_req,res,next)=>{
  try{const {rows}=await pool.query('SELECT * FROM portal_event ORDER BY starts_at DESC LIMIT 500');res.json({events:rows});}
  catch(error){next(error);}
});
router.post('/events',async(req,res,next)=>{
  try{
    const {title,description='',starts_at,ends_at=null,location='',audience='students',status='draft'}=req.body;
    if(!title?.trim()||!starts_at||Number.isNaN(Date.parse(starts_at))||!['public','students'].includes(audience)||!['draft','published'].includes(status))return res.status(400).json({error:'Renseignez un titre, une date et des paramètres valides.'});
    if(ends_at&&(!Number.isFinite(Date.parse(ends_at))||Date.parse(ends_at)<Date.parse(starts_at)))return res.status(400).json({error:'La date de fin doit suivre la date de début.'});
    const {rows}=await pool.query(`INSERT INTO portal_event(title,description,starts_at,ends_at,location,audience,status,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,[title.trim(),String(description).slice(0,2000),starts_at,ends_at,String(location).slice(0,240),audience,status,req.user.id]);
    res.status(201).json({event:rows[0]});
  }catch(error){next(error);}
});
router.put('/events/:id',async(req,res,next)=>{
  try{
    if(!validId(req.params.id))return res.status(400).json({error:'Identifiant invalide.'});
    const {title,description='',starts_at,ends_at=null,location='',audience='students',status='draft'}=req.body;
    if(!title?.trim()||!starts_at||Number.isNaN(Date.parse(starts_at))||!['public','students'].includes(audience)||!['draft','published'].includes(status))return res.status(400).json({error:'Renseignez un titre, une date et des paramètres valides.'});
    if(ends_at&&(!Number.isFinite(Date.parse(ends_at))||Date.parse(ends_at)<Date.parse(starts_at)))return res.status(400).json({error:'La date de fin doit suivre la date de début.'});
    const {rows}=await pool.query(`UPDATE portal_event SET title=$1,description=$2,starts_at=$3,ends_at=$4,location=$5,audience=$6,status=$7,updated_at=now() WHERE id=$8 RETURNING *`,[title.trim(),String(description).slice(0,2000),starts_at,ends_at,String(location).slice(0,240),audience,status,req.params.id]);
    if(!rows[0])return res.status(404).json({error:'Événement introuvable.'});res.json({event:rows[0]});
  }catch(error){next(error);}
});
router.delete('/events/:id',async(req,res,next)=>{
  try{if(!validId(req.params.id))return res.status(400).json({error:'Identifiant invalide.'});const result=await pool.query('DELETE FROM portal_event WHERE id=$1',[req.params.id]);if(!result.rowCount)return res.status(404).json({error:'Événement introuvable.'});res.status(204).end();}
  catch(error){next(error);}
});

router.get('/resources', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT r.id,r.title,r.description,r.category,r.audience,r.status,r.course_id,c.title AS course_title,r.original_name,r.size_bytes,r.created_at FROM portal_resource r LEFT JOIN portal_course c ON c.id=r.course_id ORDER BY r.created_at DESC LIMIT 500`);
    res.json({ resources: rows });
  } catch (error) { next(error); }
});
router.get('/resources/:id/download', async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Identifiant invalide.' });
    const { rows } = await pool.query('SELECT original_name,stored_name FROM portal_resource WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Ressource introuvable.' });
    res.download(path.join(uploadDir, rows[0].stored_name), rows[0].original_name, (err) => { if (err && !res.headersSent) next(err); });
  } catch (error) { next(error); }
});
router.patch('/resources/:id/status', async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Identifiant invalide.' });
    const status = validEnum(req.body.status, ['draft', 'published'], null);
    if (!status) return res.status(400).json({ error: 'Statut invalide.' });
    const { rows } = await pool.query('UPDATE portal_resource SET status=$1 WHERE id=$2 RETURNING id,status', [status, req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Ressource introuvable.' });
    res.json({ resource: rows[0] });
  } catch (error) { next(error); }
});
router.post('/resources', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Sélectionnez un fichier.' });
    const { title, description='', category='', audience='students', status='published' } = req.body;
    if (!title?.trim() || title.trim().length > 240 || !['public','students'].includes(audience) || !['draft','published'].includes(status)) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: 'Renseignez un titre et des paramètres valides.' });
    }
    const { rows } = await pool.query(
      `INSERT INTO portal_resource (title,description,category,audience,status,course_id,original_name,stored_name,mime_type,size_bytes,uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id,title,description,category,audience,status,original_name,size_bytes,created_at`,
      [title.trim(),String(description).slice(0,1000),String(category).slice(0,100),audience,status,req.body.course_id||null,req.file.originalname.slice(0,255),req.file.filename,req.file.mimetype,req.file.size,req.user.id]);
    res.status(201).json({ resource: rows[0] });
  } catch (error) { if (req.file) fs.unlink(req.file.path, () => {}); next(error); }
});
router.delete('/resources/:id', async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Identifiant invalide.' });
    const { rows } = await pool.query('DELETE FROM portal_resource WHERE id=$1 RETURNING stored_name', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Ressource introuvable.' });
    fs.unlink(path.join(uploadDir, rows[0].stored_name), () => {});
    res.status(204).end();
  } catch (error) { next(error); }
});
module.exports = router;
