const crypto = require('node:crypto');
const { pool } = require('./db');

const COOKIE = 'ifsio_session';
const MAX_AGE = 8 * 60 * 60 * 1000;
const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: MAX_AGE,
});
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

async function createSession(userId, res) {
  const token = crypto.randomBytes(32).toString('base64url');
  await pool.query(
    `INSERT INTO portal_session (token_hash,user_id,expires_at)
     VALUES ($1,$2,now() + interval '8 hours')`,
    [hashToken(token), userId],
  );
  res.cookie(COOKIE, token, cookieOptions());
}

async function authenticate(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE];
    if (!token || token.length > 100) return res.status(401).json({ error: 'Connexion requise.' });
    const { rows } = await pool.query(
      `SELECT u.id,u.email,u.role,u.status,u.full_name,u.matricule,u.filiere,u.niveau,u.annee_academique
       FROM portal_session s JOIN portal_user u ON u.id=s.user_id
       WHERE s.token_hash=$1 AND s.expires_at>now()`,
      [hashToken(token)],
    );
    if (!rows[0] || rows[0].status !== 'active') {
      res.clearCookie(COOKIE, { ...cookieOptions(), maxAge: undefined });
      return res.status(401).json({ error: rows[0]?.status === 'pending' ? 'Votre demande attend la validation de l’Institut.' : 'Session expirée. Reconnectez-vous.' });
    }
    req.user = rows[0];
    next();
  } catch (error) { next(error); }
}

function requireRole(role) {
  return (req, res, next) => req.user?.role === role
    ? next()
    : res.status(403).json({ error: 'Accès non autorisé.' });
}

async function logout(req, res) {
  const token = req.cookies?.[COOKIE];
  if (token) await pool.query('DELETE FROM portal_session WHERE token_hash=$1', [hashToken(token)]);
  res.clearCookie(COOKIE, { ...cookieOptions(), maxAge: undefined });
}

function sameOrigin(req, res, next) {
  const origin = req.get('origin');
  if (!origin) return res.status(403).json({ error: 'Origine de requête requise.' });
  try {
    if (new URL(origin).host !== req.get('host')) return res.status(403).json({ error: 'Origine de requête refusée.' });
  } catch { return res.status(403).json({ error: 'Origine de requête invalide.' }); }
  next();
}

module.exports = { authenticate, requireRole, createSession, logout, sameOrigin };
