const { Pool } = require("pg");
const env = require("../config/env");

const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  // SSL requis par les bases managées (Render/Neon/Supabase) en connexion externe.
  ssl: env.databaseSsl ? { rejectUnauthorized: false } : undefined,
});

pool.on("error", (err) => {
  console.error("[db] erreur inattendue sur une connexion inactive du pool", err);
  process.exit(1);
});

async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  if (env.nodeEnv === "development") {
    const duration = Date.now() - start;
    console.log("[db]", { text, duration, rows: res.rowCount });
  }
  return res;
}

/**
 * Exécute une série d'opérations dans une transaction.
 * `fn` reçoit un client dédié ; toutes les requêtes doivent passer par lui.
 */
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, withTransaction };
