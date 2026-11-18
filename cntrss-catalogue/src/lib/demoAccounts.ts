import type { UserRole } from '../types';

// Comptes de démonstration (module serveur uniquement).
//
// Ces comptes existent réellement en base après le seed : mêmes e-mails que le
// corpus livré (src/data/mockAdminData.ts). Le mot de passe partagé sert au
// seed et, si ENABLE_DEMO_LOGIN n'est pas désactivé, à l'endpoint
// /api/auth/config qui alimente les boutons « connexion rapide » du frontend.
// En production : ENABLE_DEMO_LOGIN=false (et changement des mots de passe).

export interface DemoAccountRef {
  role: UserRole;
  email: string;
}

export const DEMO_ACCOUNT_REFS: DemoAccountRef[] = [
  { role: 'Étudiant', email: 'aymericakpo2@gmail.com' },
  { role: 'Enseignant-Chercheur', email: 'm.chabi@univ-parakou.bj' },
  { role: 'Bibliothécaire', email: 'biblio@cntrss.bj' },
  { role: 'Administrateur', email: 'admin@cntrss.bj' }
];

/** Les boutons de connexion rapide sont activés par défaut, désactivables en production. */
export function isDemoLoginEnabled(): boolean {
  return (process.env.ENABLE_DEMO_LOGIN ?? 'true').toLowerCase() !== 'false';
}

/** Mot de passe commun aux comptes seedés (surchargeable par DEMO_LOGIN_PASSWORD). */
export function demoPassword(): string {
  return process.env.DEMO_LOGIN_PASSWORD || 'Cntrss2026!';
}
