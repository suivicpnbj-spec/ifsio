# MES ACTES

Plateforme de dépôt numérique des demandes d’actes administratifs et académiques de
l’**IFSIO — Institut de Formation en Soins Infirmiers et Obstétricaux**
(Université de Parakou, Bénin).

Elle dématérialise le dépôt des dossiers physiques : l’étudiant dépose sa demande en
ligne à toute heure, la scolarité l’instruit depuis sa file de travail. Objectif :
supprimer les files d’attente, les déplacements et les contraintes d’horaires de bureau.

> **Périmètre actuel.** La plateforme gère le dépôt, le suivi et l’instruction des
> dossiers. Elle ne produit **pas encore** les actes eux-mêmes : l’accès à la base de
> données des étudiants de l’IFSIO n’est pas encore disponible. Aucune donnée ni
> signature d’acte n’est simulée.

> **Déploiement.** Front React compilé + API Express + base SQLite dans un même
> processus. En production, la base démarre avec le seul compte scolarité défini par
> `ADMIN_EMAIL` / `ADMIN_PASSWORD` ; aucun compte de démonstration n’est créé.

## Stack

- React 19 + TypeScript (strict) + Vite 7
- Tailwind CSS v4 (`@tailwindcss/vite`, thème dans `src/index.css`)
- `lucide-react` (icônes), `qrcode` (QR du récépissé, encodage conforme à la norme)
- API Express 4 + `node:sqlite` (Node ≥ 22.9), sessions JWT + refresh cookie httpOnly
- Pièces jointes réellement stockées sur disque ; paiement intégré à la dernière étape
  du dépôt (FeeXPay Mobile Money/carte en réel, mock en développement, caisse manuelle)
  avec quittance et accusé de réception envoyés par e-mail (Resend, journal en dev)
- Vitest (tests unitaires) + parcours de bout en bout API et navigateur
  (`scripts/e2e-api.mjs`, `scripts/e2e-ui.mjs`)

## Démarrage

```bash
npm install
npm run dev        # front http://localhost:5173 + API http://localhost:4000
```

| Script | Rôle |
| --- | --- |
| `npm run dev` | front Vite + API (`tsx watch`) en parallèle |
| `npm run build` | typecheck + build du front (`dist/`) et de l'API (`server-dist/`) |
| `npm start` | serveur de production (front compilé + API) |
| `npm run typecheck` | `tsc --noEmit` (front et serveur) |
| `npm test` | tests unitaires Vitest |
| `npm run test:e2e` | parcours API de bout en bout (serveur lancé) |
| `npm run test:e2e:ui` | parcours navigateur Playwright/Chrome (serveur lancé) |
| `npm run icons` | régénère les PNG d’identité (icônes PWA, image de partage) |

## Déploiement

### Variables d'environnement

Copier `.env.example` en `.env` (`cp .env.example .env`) et renseigner au minimum
(le fichier est chargé automatiquement par `npm start`) :

| Variable | Rôle |
| --- | --- |
| `JWT_SECRET` | **obligatoire en production**, `openssl rand -hex 32` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | compte scolarité créé au premier démarrage (mot de passe ≥ 12 caractères) |
| `PUBLIC_BASE_URL` | URL publique de la plateforme (affichée sur les récépissés) |
| `DATABASE_FILE`, `UPLOAD_DIR` | chemins persistants (base SQLite + pièces jointes) |
| `TRUST_PROXY` | nombre de proxies devant l'app (1 derrière Nginx/Caddy/Render) |
| `PAYMENT_PROVIDER` | `manual` par défaut, `feexpay` en réel (Mobile Money/carte) |
| `FEXPAY_API_TOKEN`, `FEXPAY_SHOP_ID` | identifiants marchand FeeXPay (clé `fp_…`) |
| `RESEND_API_KEY`, `EMAIL_FROM` | e-mails automatiques ; sans clé, journal `data/outbox.log` |

Le serveur refuse de démarrer en production sans `JWT_SECRET`, ou avec une base vide
si `ADMIN_EMAIL` / `ADMIN_PASSWORD` ne sont pas fournis.

### Lancement en production

```bash
npm ci && npm run build
NODE_ENV=production JWT_SECRET=… ADMIN_EMAIL=… ADMIN_PASSWORD=… npm start
```

L'application sert le front et l'API sur le même port (`PORT`, 4000 par défaut) : un
seul service à exposer derrière un reverse proxy HTTPS.

### Après le déploiement

1. Se connecter avec le compte scolarité, changer le mot de passe dans
   « Paramètres » (carte « Mot de passe du compte »), puis renseigner l'établissement
   et les tarifs sur la même page.
2. Vérifier `GET /api/health`.
3. Sauvegarder le répertoire `data/` (base SQLite + pièces jointes) et tester une
   restauration.

## Comptes

- **Étudiants** : inscription en ligne (nom, matricule, filière, niveau, e-mail,
  mot de passe). Aucun compte préexistant n’est amorcé.
- **Scolarité** : compte créé au premier démarrage depuis `ADMIN_EMAIL` /
  `ADMIN_PASSWORD` ; en développement, un compte local `scolarite@local.test` est
  proposé faute de configuration.

## Parcours couverts

- **Public** : accueil, catalogue des prestations (recherche, filtres, fiche acte),
  aide & contact.
- **Étudiant** : formulaire de dépôt en 4 étapes (informations → pièces jointes →
  récapitulatif → confirmation) avec envoi réel des fichiers, récépissé horodaté
  numéroté (QR de suivi), suivi du dossier (timeline, messages, compléments),
  réclamations, profil.
- **Scolarité** : file d’instruction (filtres, recherche, audit des pièces),
  instruction dossier par dossier (validation, demande de complément, clôture),
  **statistiques** (KPI, répartitions, délai moyen d’instruction) et **export CSV**,
  catalogue & tarifs, paramètres de l’établissement.

## Structure

```
src/
  components/   Shell (header/nav/footer), récépissé (QR), ErrorBoundary, UI
                marques : Logo.tsx (produit) et InstitutionalEmblem.tsx (établissement)
  data/         catalogue des actes, établissement, profils par défaut
  lib/          routeur, api.ts (client HTTP), qr.ts, csv.ts, stats.ts, utils.ts
  pages/        une page par route (accueil public, espace étudiant, back-office)
  store.tsx     état global alimenté par l'API + actions
  types.ts      modèle de données
server/
  routes/       auth, catalogue, dossiers, pièces, notifications, admin, public
  db/           schéma SQLite, dépôt, amorçage (catalogue + compte scolarité)
  services/     paiements (manual / mock / feexpay), e-mails transactionnels
scripts/
  e2e-api.mjs   parcours API de bout en bout (serveur lancé, base temporaire)
  e2e-ui.mjs    parcours navigateur Playwright/Chrome (inscription → instruction)
  generate-icons.mjs  PNG d’identité tirés du SVG (icônes, image de partage)
```

### Identité visuelle : deux marques, deux rôles

- **`BrandMark`** (`src/components/Logo.tsx`) — la marque produit MES ACTES, « feuille &
  sceau », réservée à l’interface : en-tête, footer, connexion, cartes et visuels de
  la page d’accueil.
- **`InstitutionalEmblem`** (`src/components/InstitutionalEmblem.tsx`) — l’écu circulaire
  de l’établissement, composé à partir des données `establishment` (nom en couronne haute,
  université en couronne basse, sigle et pays au centre). Il figure sur le récépissé et
  les documents remis par l’administration.

Les deux composants acceptent `mono` pour une sortie en encre unique (impression noir et
blanc, gravure) ; à l’impression, les marques passent aussi en niveaux de gris via la
classe `.doc-mark` (règle `@media print`). Les icônes de PWA et l’image de partage sont
tirées du SVG livré par `npm run icons`.

Le QR du récépissé est **réellement encodé** (`src/lib/qr.ts`, bibliothèque `qrcode`,
mode octet, correction d’erreur M) : un scanner restitue le numéro de dossier. Le test
`src/lib/qr.test.ts` le prouve en le décodant avec `jsQR`.

## Tests

`npm test` (Vitest, 40 tests) couvre :

- `src/lib/qr.test.ts` — le QR généré est **décodé par `jsQR`** (décodeur indépendant) et
  restitue exactement le numéro de dossier ;
- `src/lib/csv.test.ts` — construction de l’export CSV (en-têtes, échappement, colonnes
  de paiement) ;
- `src/lib/stats.test.ts` — calcul des statistiques du back-office et parsing des dates
  françaises ;
- `src/lib/utils.test.ts` — formatage des montants, moyennes pondérées, identifiants,
  type de document ;
- `src/components/ErrorBoundary.test.tsx` — l’ErrorBoundary intercepte une erreur de
  rendu et affiche l’écran de secours (jsdom) ;
- `src/components/marks.test.tsx` — les deux marques : couleurs par défaut, aplat `mono`
  sans aucune couleur codée en dur, couronnes de l’emblème reliées à des tracés déclarés
  et corps de texte borné même pour un nom d’établissement très long (jsdom).

Deux parcours de bout en bout rejouent la plateforme réelle, chacun sur une base
temporaire jetable :

- `npm run test:e2e` (API) — inscription, connexion, dépôt avec de vraies pièces,
  récépissé, instruction par la scolarité, validation sans signature fabriquée,
  changement de mot de passe, routes retirées (signature, démonstration) en 404 ;
- `npm run test:e2e:ui` (navigateur) — le même parcours dans Chrome : accueil, catalogue
  sans ressource fictive, dépôt de fichiers réels depuis l’interface, suivi étudiant,
  instruction et validation côté scolarité, zéro erreur console.

## Limites connues

- SQLite en mono-instance : pas de réplication ; sauvegarder le répertoire `data/`.
- La plateforme ne délivre pas encore les actes : l’accès à la base étudiants de
  l’IFSIO reste à mettre en place. Le récépissé atteste le dépôt, pas la délivrance.
- Paiement intégré au dépôt : FeeXPay (Mobile Money/carte) dès renseignement des
  identifiants marchands, `mock` en développement, caisse manuelle en attendant.
- E-mails transactionnels (accusé de réception + quittance) via Resend ; sans clé,
  journalisés dans `data/outbox.log`. Notifications internes en complément.
- Limitation des tentatives de connexion en mémoire : adaptée à un seul processus.
