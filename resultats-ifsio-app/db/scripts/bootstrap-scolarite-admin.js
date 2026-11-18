/** Create the first production administrator interactively.
 * Usage: NODE_ENV=production npm run admin:bootstrap
 */
const fs = require("fs");
const { createInterface } = require("readline");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");

if (process.env.NODE_ENV === "production" && !process.env.DOTENV_CONFIG_PATH) {
  throw new Error("En production, indiquez explicitement DOTENV_CONFIG_PATH (fichier de production ou /dev/null si la plateforme injecte les variables).");
}
const envPath = process.env.DOTENV_CONFIG_PATH || (fs.existsSync(".env.local") ? ".env.local" : ".env");
require("dotenv").config({ path: envPath });

function askVisible(prompt) {
  const io = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => io.question(prompt, (answer) => { io.close(); resolve(answer.trim()); }));
}

function askSecret(prompt) {
  if (!process.stdin.isTTY) throw new Error("Exécutez cette commande dans un terminal interactif pour saisir le mot de passe sans l’afficher.");
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    let value = "";
    stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();
    const cleanup = () => {
      stdin.removeListener("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write("\n");
    };
    const onData = (buffer) => {
      const key = buffer.toString("utf8");
      if (key === "\u0003") {
        cleanup();
        reject(new Error("Saisie annulée."));
      } else if (key === "\r" || key === "\n") {
        cleanup();
        resolve(value);
      } else if (key === "\u007f" || key === "\b") {
        value = value.slice(0, -1);
      } else if (!key.startsWith("\u001b") && key >= " ") {
        value += key;
      }
    };
    stdin.on("data", onData);
  });
}

async function main() {
  if (process.env.NODE_ENV === "production" && !process.argv.includes("--confirm-production")) {
    throw new Error("En production, ajoutez explicitement --confirm-production après avoir vérifié DATABASE_URL.");
  }
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL est obligatoire.");
  const nom = await askVisible("Nom du responsable administrateur : ");
  const email = (await askVisible("Adresse email : ")).toLowerCase();
  const motDePasse = await askSecret("Mot de passe initial (16 caractères minimum) : ");
  if (nom.length < 2 || nom.length > 120) throw new Error("Le nom doit contenir entre 2 et 120 caractères.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Adresse email invalide.");
  if (motDePasse.length < 16) throw new Error("Le mot de passe doit contenir au moins 16 caractères.");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock($1)", [73829105]);
    const { rows: [cible] } = await client.query("SELECT current_database() AS base, inet_server_addr()::text AS serveur");
    console.log(`Base ciblée : ${cible.base} @ ${cible.serveur || "serveur managé"}`);
    const confirmation = await askVisible("Saisissez exactement le nom de la base pour continuer : ");
    if (confirmation !== cible.base) throw new Error("Nom de base incorrect; aucun compte n’a été créé.");
    const { rows } = await client.query("SELECT id FROM utilisateur_scolarite WHERE role = 'admin' LIMIT 1");
    if (rows.length) throw new Error("Un compte administrateur existe déjà. Aucun compte n’a été modifié.");
    const hash = await bcrypt.hash(motDePasse, Number(process.env.BCRYPT_SALT_ROUNDS) || 12);
    await client.query(
      `INSERT INTO utilisateur_scolarite (nom, email, mot_de_passe_hash, role, actif)
       VALUES ($1, $2, $3, 'admin', true)`, [nom, email, hash]
    );
    await client.query("COMMIT");
    console.log(`Administrateur initial créé : ${email}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Création impossible :", error.message);
  process.exitCode = 1;
});
