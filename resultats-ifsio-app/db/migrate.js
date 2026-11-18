/**
 * Exécute séquentiellement les fichiers .sql du dossier migrations/
 * en se basant sur une table de suivi schema_migrations.
 *
 * Usage : node db/migrate.js
 */
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
const fichierEnv = process.env.DOTENV_CONFIG_PATH || (fs.existsSync(".env.local") ? ".env.local" : ".env");
require("dotenv").config({ path: fichierEnv });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Bases managées (Render/Neon/Supabase) : SSL obligatoire en connexion externe.
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});
const MIGRATIONS_DIR = path.join(__dirname, "migrations");
// Les deux services Render partagent la même base et peuvent démarrer ensemble.
// Le verrou transactionnel empêche qu'ils appliquent simultanément les migrations.
const MIGRATION_LOCK_ID = 73829104;

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename    VARCHAR(255) PRIMARY KEY,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

async function getAppliedMigrations(client) {
  const res = await client.query("SELECT filename FROM schema_migrations");
  return new Set(res.rows.map((r) => r.filename));
}

async function run() {
  const client = await pool.connect();
  let verrouPris = false;
  try {
    await client.query("SELECT pg_advisory_lock($1)", [MIGRATION_LOCK_ID]);
    verrouPris = true;
    await ensureMigrationsTable(client);
    const applied = await getAppliedMigrations(client);

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`[migrate] déjà appliquée : ${file}`);
        continue;
      }
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
      console.log(`[migrate] application de : ${file}`);
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [file]);
        await client.query("COMMIT");
        console.log(`[migrate] ✓ ${file} appliquée avec succès`);
      } catch (err) {
        await client.query("ROLLBACK");
        console.error(`[migrate] ✗ échec sur ${file}`);
        throw err;
      }
    }
    console.log("[migrate] terminé.");
  } finally {
    try {
      if (verrouPris) await client.query("SELECT pg_advisory_unlock($1)", [MIGRATION_LOCK_ID]);
    } finally {
      client.release();
      await pool.end();
    }
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
