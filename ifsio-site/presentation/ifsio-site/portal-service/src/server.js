require('dotenv').config({ path: process.env.DOTENV_CONFIG_PATH || '.env.local' });
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL manquant. Configurez .env.local.');
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) throw new Error('SESSION_SECRET doit contenir au moins 32 caractères.');
const app = require('./app');
const { pool } = require('./db');
const port = Number(process.env.PORT || 8080);
const host = process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');
const server = app.listen(port, host, () => console.log(`[IFSIO] Site et services actifs sur http://${host}:${port}`));
async function stop(signal) {
  console.log(`[IFSIO] arrêt (${signal})`);
  server.close(async () => { await pool.end(); process.exit(0); });
}
process.on('SIGINT', () => stop('SIGINT'));
process.on('SIGTERM', () => stop('SIGTERM'));
