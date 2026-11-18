import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | null = null;

// Le serveur peut démarrer sans base de données (repli mémoire pour le
// catalogue). L'authentification, elle, exige une base : ce drapeau permet aux
// middlewares de répondre 503 plutôt que de laisser croire à une session valide.
let dbReady = false;

export function markDbReady(ready: boolean): void {
  dbReady = ready;
}

export function isDbReady(): boolean {
  return dbReady;
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
  });
}

export type DbClient = PrismaClient;

export function getPrisma(): PrismaClient {
  if (!prisma) {
    prisma = createPrismaClient();
  }
  return prisma;
}

export async function prismaConnect(): Promise<void> {
  await getPrisma().$connect();
}

export async function prismaDisconnect(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

export async function prismaPing(): Promise<boolean> {
  try {
    await getPrisma().$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
