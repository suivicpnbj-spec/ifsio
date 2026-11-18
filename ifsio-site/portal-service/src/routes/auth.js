const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db');
const { authenticate, createSession, logout, sameOrigin } = require('../auth');
const router = express.Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/register', sameOrigin, async (req, res, next) => {
  try {
    const { full_name, email, password, matricule, filiere, niveau, annee_academique } = req.body;
    if (!full_name?.trim() || full_name.trim().length > 180) return res.status(400).json({ error: 'Indiquez votre nom complet.' });
    if (!emailPattern.test(String(email || '')) || email.length > 254) return res.status(400).json({ error: 'Adresse courriel invalide.' });
    if (typeof password !== 'string' || password.length < 12 || password.length > 200) return res.status(400).json({ error: 'Choisissez un mot de passe d’au moins 12 caractères.' });
    if (!matricule?.trim() || matricule.length > 50) return res.status(400).json({ error: 'Le matricule est requis.' });
    const hash = await bcrypt.hash(password, 12);
    await pool.query(
      `INSERT INTO portal_user (email,password_hash,role,status,full_name,matricule,filiere,niveau,annee_academique)
       VALUES (lower($1),$2,'student','pending',$3,$4,$5,$6,$7)`,
      [email.trim(), hash, full_name.trim(), matricule.trim(), String(filiere || '').slice(0,120), String(niveau || '').slice(0,40), String(annee_academique || '').slice(0,9)],
    );
    res.status(202).json({ message: 'Demande reçue. L’Institut doit valider votre compte avant votre première connexion.' });
  } catch (error) { next(error); }
});

router.post('/login', sameOrigin, async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!emailPattern.test(email) || password.length > 200) return res.status(400).json({ error: 'Adresse courriel ou mot de passe invalide.' });
    const { rows } = await pool.query('SELECT * FROM portal_user WHERE email=$1', [email]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ error: 'Adresse courriel ou mot de passe incorrect.' });
    if (user.status === 'pending') return res.status(403).json({ error: 'Votre demande de compte attend la validation de l’Institut.' });
    if (user.status !== 'active') return res.status(403).json({ error: 'Ce compte est suspendu. Contactez l’Institut.' });
    await createSession(user.id, res);
    res.json({ user: { id: user.id, email: user.email, role: user.role, full_name: user.full_name } });
  } catch (error) { next(error); }
});

router.post('/logout', sameOrigin, authenticate, async (req, res, next) => {
  try { await logout(req, res); res.status(204).end(); } catch (error) { next(error); }
});
router.get('/me', authenticate, (req, res) => res.json({ user: req.user }));
module.exports = router;
