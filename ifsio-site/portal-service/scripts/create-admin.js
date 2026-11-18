require('dotenv').config({ path: process.env.DOTENV_CONFIG_PATH || '.env.local' });
const readline = require('node:readline');
const bcrypt = require('bcryptjs');
const { pool } = require('../src/db');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (question) => new Promise((resolve) => rl.question(question, resolve));
function askHidden(question) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY || !process.stdin.setRawMode) return reject(new Error('Lancez cette commande dans un terminal interactif.'));
    process.stdout.write(question);
    let value = '';
    const onData = (char) => {
      if (char === '\u0003') { process.stdin.setRawMode(false); process.stdin.off('data', onData); reject(new Error('Annulé.')); return; }
      if (char === '\r' || char === '\n') { process.stdin.setRawMode(false); process.stdin.off('data', onData); process.stdout.write('\n'); resolve(value); return; }
      if (char === '\u007f' || char === '\b') { value = value.slice(0, -1); return; }
      if (char >= ' ') value += char;
    };
    process.stdin.setRawMode(true); process.stdin.resume(); process.stdin.setEncoding('utf8'); process.stdin.on('data', onData);
  });
}
(async () => {
  try {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL manquant.');
    const { rows: existing } = await pool.query("SELECT count(*)::int AS n FROM portal_user WHERE role='admin'");
    const fullName = (await ask('Nom complet : ')).trim();
    const email = (await ask('Courriel administrateur : ')).trim().toLowerCase();
    const password = await askHidden('Mot de passe (12 caractères minimum) : ');
    const confirm = await askHidden('Confirmez le mot de passe : ');
    if (!fullName || fullName.length > 180 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Nom ou courriel invalide.');
    if (password.length < 12 || password !== confirm) throw new Error('Les mots de passe doivent correspondre et contenir 12 caractères minimum.');
    if (existing[0].n > 0) {
      const answer = (await ask('Un administrateur existe déjà. Ajouter un autre administrateur ? (oui/non) ')).trim().toLowerCase();
      if (answer !== 'oui') throw new Error('Création annulée.');
    }
    const hash = await bcrypt.hash(password, 12);
    await pool.query("INSERT INTO portal_user(email,password_hash,role,status,full_name) VALUES($1,$2,'admin','active',$3)", [email,hash,fullName]);
    console.log('Compte administrateur créé.');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
  finally { rl.close(); await pool.end(); }
})();
