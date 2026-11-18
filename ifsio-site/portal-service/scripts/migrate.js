require('dotenv').config({ path: process.env.DOTENV_CONFIG_PATH || '.env.local' });
const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL manquant.');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined });
const migrationsDir = path.resolve(__dirname, '../db/migrations');

async function run() {
  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [81160231]);
    await client.query('CREATE TABLE IF NOT EXISTS portal_migration (filename text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
    const { rows } = await client.query('SELECT filename FROM portal_migration');
    const applied = new Set(rows.map((row) => row.filename));
    for (const filename of fs.readdirSync(migrationsDir).filter((name) => name.endsWith('.sql')).sort()) {
      if (applied.has(filename)) continue;
      await client.query('BEGIN');
      try {
        await client.query(fs.readFileSync(path.join(migrationsDir, filename), 'utf8'));
        await client.query('INSERT INTO portal_migration(filename) VALUES($1)', [filename]);
        await client.query('COMMIT');
        console.log(`[ifsio:migrate] ${filename} appliquée`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [81160231]).catch(() => {});
    client.release();
    await pool.end();
  }
}
run().catch((error) => { console.error('[ifsio:migrate]', error.message); process.exit(1); });
