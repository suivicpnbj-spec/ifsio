require('dotenv').config({ path: process.env.DOTENV_CONFIG_PATH || '.env.local' });
const bcrypt = require('bcryptjs');
const { pool } = require('../src/db');

const accounts = [
  { role: 'admin', email: 'demo.admin@ifsio.local', password: 'DemoAdmin!2026', name: 'Administration Démo' },
  { role: 'student', email: 'demo.essfe@ifsio.local', password: 'DemoEssfe!2026', name: 'Aïcha Démo — ESSFE', matricule: 'DEMO-ESSFE-001', filiere: 'ESSFE', niveau: 'Licence 2' },
  { role: 'student', email: 'demo.esiie@ifsio.local', password: 'DemoEsiie!2026', name: 'Koffi Démo — ESIIE', matricule: 'DEMO-ESIIE-001', filiere: 'ESIIE', niveau: 'Licence 1' },
];

(async () => {
  const client = await pool.connect();
  try {
    const { rows: databases } = await client.query('SELECT current_database() AS name');
    if (!databases[0].name.endsWith('_local')) throw new Error('Refus de créer des comptes de démonstration hors d’une base dont le nom finit par _local.');
    if (process.env.NODE_ENV === 'production') throw new Error('Refus de créer des comptes de démonstration en production.');
    await client.query('BEGIN');
    const hashes = await Promise.all(accounts.map((account) => bcrypt.hash(account.password, 12)));
    const users = {};
    for (let index = 0; index < accounts.length; index += 1) {
      const account = accounts[index];
      const { rows } = await client.query(
        `INSERT INTO portal_user(email,password_hash,role,status,full_name,matricule,filiere,niveau,annee_academique,approved_at)
         VALUES($1,$2,$3::varchar,'active',$4,$5,$6,$7,$8,CASE WHEN $3::varchar='student' THEN now() END)
         ON CONFLICT(email) DO UPDATE SET password_hash=EXCLUDED.password_hash,role=EXCLUDED.role,status='active',full_name=EXCLUDED.full_name,
           matricule=EXCLUDED.matricule,filiere=EXCLUDED.filiere,niveau=EXCLUDED.niveau,annee_academique=EXCLUDED.annee_academique,
           approved_at=CASE WHEN EXCLUDED.role='student' THEN now() ELSE NULL END,updated_at=now()
         RETURNING id,email`,
        [account.email, hashes[index], account.role, account.name, account.matricule || null, account.filiere || null, account.niveau || null, account.role === 'student' ? '2026-2027' : null],
      );
      users[account.role === 'admin' ? 'admin' : account.filiere] = rows[0].id;
    }
    await client.query("UPDATE portal_user SET approved_by=$1 WHERE email IN ('demo.essfe@ifsio.local','demo.esiie@ifsio.local')", [users.admin]);

    const news = await client.query(
      `INSERT INTO portal_content(kind,slug,title,summary,body,category,status,audience,created_by,published_at)
       VALUES('news','demo-bienvenue-portail','[DÉMO] Bienvenue sur le portail IFSIO','Publication de démonstration, sans information officielle.','Ce contenu est fictif et sert uniquement à présenter les fonctions du portail étudiant.','Actualités','published','public',$1,now())
       ON CONFLICT(slug) DO UPDATE SET title=EXCLUDED.title,summary=EXCLUDED.summary,body=EXCLUDED.body,status='published',audience='public',published_at=now(),updated_at=now()
       RETURNING id`, [users.admin]);
    await client.query(
      `INSERT INTO portal_course(code,title,description,filiere,niveau,annee_academique,created_by)
       VALUES($1,$2,$3,$4,$5,'2026-2027',$6)
       ON CONFLICT(code,filiere,niveau,annee_academique) DO UPDATE SET title=EXCLUDED.title,description=EXCLUDED.description,updated_at=now()`,
      ['DEMO-ESSFE-L2', '[DÉMO] Introduction aux soins obstétricaux', 'Cours fictif pour illustrer la liste des enseignements.', 'ESSFE', 'Licence 2', users.admin],
    );
    await client.query(
      `INSERT INTO portal_course(code,title,description,filiere,niveau,annee_academique,created_by)
       VALUES($1,$2,$3,$4,$5,'2026-2027',$6)
       ON CONFLICT(code,filiere,niveau,annee_academique) DO UPDATE SET title=EXCLUDED.title,description=EXCLUDED.description,updated_at=now()`,
      ['DEMO-ESIIE-L1', '[DÉMO] Bases des soins infirmiers', 'Cours fictif pour illustrer la liste des enseignements.', 'ESIIE', 'Licence 1', users.admin],
    );
    const startsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await client.query(
      `INSERT INTO portal_event(title,description,starts_at,location,audience,status,created_by)
       SELECT '[DÉMO] Rencontre de rentrée', 'Événement fictif pour présenter le calendrier étudiant.', $1, 'Campus — lieu fictif', 'students', 'published', $2
       WHERE NOT EXISTS (SELECT 1 FROM portal_event WHERE title='[DÉMO] Rencontre de rentrée')`, [startsAt, users.admin],
    );
    await client.query('COMMIT');
    console.log(`Comptes de démonstration prêts : ${accounts.length}. Publication : ${news.rows[0].id}.`);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
})();
