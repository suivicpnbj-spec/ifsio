import { PrismaClient } from '@prisma/client';
import path from 'path';
import { pathToFileURL } from 'url';
import { INITIAL_USER_ACCOUNTS } from '../src/data/mockAdminData';
import { userAccountDbCreate } from '../src/lib/prismaMappers';
import { hashPassword } from '../src/lib/password';
import { demoPassword } from '../src/lib/demoAccounts';

// Le catalogue ne contient plus de données statiques : la plateforme démarre
// avec zéro document (compteurs à zéro) et le catalogue test sera fourni par
// l'équipe. Seuls les comptes utilisateurs sont créés au premier démarrage :
// ils sont nécessaires pour se connecter (bibliothécaire / administrateur) et
// pour administrer la plateforme.
//
// Le seed est idempotent (rappelé à chaque démarrage par seedIfEmpty).
export async function seed(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();

    const existingUsers = await prisma.userAccount.count();
    if (existingUsers > 0) {
      return;
    }

    // En production, le mot de passe commun de démonstration est refusé :
    // il faut fournir DEMO_LOGIN_PASSWORD (voir .env.production.example).
    const password = demoPassword();
    if (process.env.NODE_ENV === 'production' && password === 'Cntrss2026!') {
      throw new Error(
        "Seed refusé en production : définissez DEMO_LOGIN_PASSWORD (mot de passe unique des comptes) " +
          "avant de lancer `npm run db:seed`."
      );
    }
    const passwordHash = await hashPassword(password);
    await prisma.userAccount.createMany({
      data: INITIAL_USER_ACCOUNTS.map((user) => userAccountDbCreate(user, passwordHash))
    });

    console.log(
      `Seed completed: ${INITIAL_USER_ACCOUNTS.length} comptes utilisateurs, catalogue vide ` +
        `(mot de passe des comptes : ${process.env.NODE_ENV === 'production' ? 'DEMO_LOGIN_PASSWORD (masqué)' : password}).`
    );
  } finally {
    await prisma.$disconnect();
  }
}

// `prisma db seed` (et `tsx prisma/seed.ts`) exécute le fichier directement.
// Quand le serveur importe ce module, le seed ne doit pas se lancer tout seul :
// il est appelé explicitement par seedIfEmpty().
const isDirectRun =
  !!process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirectRun) {
  seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}
