<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# CNTRSS — Catalogue Numérique des Travaux de Recherche en Sciences de Santé

Plateforme (React + Express) qui centralise les mémoires, thèses et rapports de recherche en
sciences de santé au Bénin.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Copier les variables d'environnement :
   `cp .env.example .env`
   - `GEMINI_API_KEY` : clé de l'assistant IA (facultatif, l'assistant bascule sur le moteur
     académique local sans clé).
   - `DATABASE_URL` : base utilisée par Prisma (par défaut `file:./dev.db`, chemin relatif au
     dossier `prisma/`).
   - `ENABLE_DEMO_LOGIN` / `DEMO_LOGIN_PASSWORD` : boutons de connexion rapide et mot de passe
     des comptes seedés (voir « Authentification »).
   - `COOKIE_SECURE` : drapeau `Secure` du cookie de session (défaut : activé si
     `NODE_ENV=production`, donc à servir en HTTPS).
3. Préparer la base de données :
   `npm run prisma:generate` (client Prisma), `npm run db:push` (schéma), `npm run db:seed`
   (données initiales — le serveur lance aussi le seed automatiquement si la base est vide)
4. Run the app:
   `npm run dev` → http://localhost:3000

## Persistance

Les données (documents, file de validation, demandes documentaires, journaux d'audit, comptes)
sont stockées dans une base **SQLite via Prisma** (`prisma/schema.prisma`, fichier `prisma/dev.db`).

- Écritures : `server.ts` écrit en base via `src/lib/prismaMappers.ts` à chaque dépôt, validation,
  demande ou action d'audit.
- Données initiales : **aucune donnée d'affichage n'est pré-remplie**. Le seed ne crée que les
  comptes utilisateurs nécessaires à la connexion et à la gouvernance : la plateforme démarre avec
  **un catalogue vide et tous les compteurs à zéro** (le catalogue test sera versé ensuite).
  Aucun jeu de données statique n'est plus affiché côté client (repli = état vide).
- Valider un dossier l'inscrit automatiquement dans le catalogue (attribut d'un DOI persistant,
  compteurs observatoire recalculés).
- Un dépôt validé est « classé et répertorié » : les écoles et facultés partenaires déposent leurs
  propres catalogues ; l'interface de dépôt grand public reste **masquée pour l'instant**.
- Assistant IA : historique des conversations côté client (nouvelle conversation, bascule,
  suppression) et **fouille du catalogue** à chaque question (les résultats réels sont joints à la
  réponse, y compris avec un catalogue vide).
- Repli : si la base est injoignable, le serveur démarre en mode mémoire (données mock) et
  journalise `Prisma boot failed, falling back to in-memory-only mode.` Les comptes et les
  sessions vivant en base, l'authentification est alors indisponible (503) plutôt que simulée.
- Les anciens fichiers `data/*.json` (persistance JSON) ne sont plus lus ni écrits : ils sont
  conservés uniquement comme référence.

### Commandes base de données

| Commande | Rôle |
| --- | --- |
| `npm run prisma:generate` | (Re)génère le client Prisma |
| `npm run db:push` | Applique le schéma à la base SQLite |
| `npm run db:seed` | Insère les données initiales si la base est vide |

## Authentification

L'authentification repose sur des **sessions serveur** (l'ancien mode démo par en-tête
`x-user-token` a été supprimé) :

- `POST /api/auth/login` vérifie l'e-mail et le mot de passe (hachage **scrypt** via
  `node:crypto`, `src/lib/password.ts`) puis ouvre une session enregistrée en base (modèle
  `Session`, `src/lib/serverAuth.ts`).
- Le navigateur ne reçoit qu'un cookie **httpOnly** `cntrss_session` (identifiant opaque) et un
  cookie lisible `cntrss_csrf` : aucun profil ni jeton n'est stocké en JavaScript/`localStorage`.
- Les mutations authentifiées exigent le jeton anti-CSRF dans l'en-tête `x-csrf-token`
  (double soumission cookie/en-tête). Le SPA l'ajoute automatiquement (`src/lib/backendApi.ts`).
- `POST /api/auth/logout` supprime la session en base ; suspendre un compte révoque immédiatement
  toutes ses sessions. La déconnexion est donc réelle, contrairement à un JWT autonome.
- Les comptes `En attente de validation` ou `Suspendu` ne peuvent pas ouvrir de session ;
  un rôle privilégié (`Bibliothécaire`, `Administrateur`) ne peut pas être choisi à l'inscription.
- Si la base est injoignable, les routes d'authentification répondent `503` (le repli mémoire ne
  couvre que le catalogue) : aucune session n'est simulée.

### Comptes de démonstration

Le seed crée de vrais comptes, avec un mot de passe commun `Cntrss2026!`
(surchargeable par `DEMO_LOGIN_PASSWORD`) :

| Rôle | E-mail |
| --- | --- |
| Étudiant | `aymericakpo2@gmail.com` |
| Enseignant-Chercheur | `m.chabi@univ-parakou.bj` |
| Bibliothécaire | `biblio@cntrss.bj` |
| Administrateur | `admin@cntrss.bj` |

Les boutons « connexion rapide » du frontend s'appuient sur `GET /api/auth/config`, qui n'expose
ces identifiants que si `ENABLE_DEMO_LOGIN` n'est pas désactivé (`ENABLE_DEMO_LOGIN=false` en
production masque les boutons et n'expose plus les mots de passe).

```bash
# Connexion : curl enregistre le cookie de session (httpOnly) et le cookie CSRF
curl -s -c /tmp/cntrss.jar -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"biblio@cntrss.bj","password":"Cntrss2026!","rememberMe":true}'

# Session courante
curl -s -b /tmp/cntrss.jar http://localhost:3000/api/auth/me

# Mutation protégée : cookie de session + jeton anti-CSRF
CSRF=$(awk '/cntrss_csrf/ {print $7}' /tmp/cntrss.jar)
curl -s -b /tmp/cntrss.jar -X POST http://localhost:3000/api/validation/val-002/approve \
  -H 'Content-Type: application/json' -H "x-csrf-token: $CSRF" -d '{}'

# Déconnexion (la session est supprimée en base)
curl -s -b /tmp/cntrss.jar -X POST http://localhost:3000/api/auth/logout \
  -H "x-csrf-token: $CSRF"
```

## Partenariats (formulaire « Devenir partenaire »)

Le bouton *Devenir partenaire* ouvre un formulaire (`src/components/PartnerFormModal.tsx`) qui :

1. enregistre la demande en base (`model PartnershipRequest`) et dans le journal d'audit ;
2. notifie l'administrateur du système par e-mail via l'API **Resend**
   (`POST https://api.resend.com/emails`, appel direct en `fetch`, aucune dépendance ajoutée).

Variables associées :

| Variable | Rôle |
| --- | --- |
| `RESEND_API_KEY` | clé API Resend (sans elle, la demande est conservée en base et l'absence d'e-mail est journalisée) |
| `PARTNER_ADMIN_EMAIL` | destinataire (défaut `admin@cntrss.bj`) |
| `PARTNER_EMAIL_FROM` | expéditeur (défaut `CNTRSS <onboarding@resend.dev>`, domaine à vérifier en production) |
| `PARTNERSHIP_MAX_PER_HOUR` | quota par IP (défaut 5) |

Les demandes reçues sont visibles dans l'onglet **Universités Partenaires** du tableau de bord admin,
qui les **traite** : un sélecteur de statut (`Nouvelle`, `En cours de traitement`, `Traité`, `Refusé`)
et le motif/réponse sont enregistrés en base via `PATCH /api/partnerships/:id` (administrateur
uniquement) et tracés dans le journal d'audit.

## Réinitialisation du mot de passe

Le lien « Mot de passe oublié ? » ouvre un vrai parcours :

1. `POST /api/auth/forgot-password` vérifie le format de l'adresse, invalide les éventuels jetons
   non utilisés, crée un **jeton aléatoire de 32 octets valable 30 minutes** et l'envoie par e-mail
   (Resend) sous la forme d'un lien `/#reset=<jeton>`.
2. La base ne conserve que l'**empreinte SHA-256** du jeton (modèle `PasswordResetToken`) : une
   fuite de base ne permet pas de rejouer un lien. Chaque jeton est à **usage unique**.
3. `POST /api/auth/reset-password` applique le nouveau mot de passe (hachage scrypt) et **révoque
   toutes les sessions ouvertes** du compte.

La réponse de la demande est **identique que le compte existe ou non** : elle ne permet pas
d'énumérer les comptes. Sans `RESEND_API_KEY`, aucun e-mail ne part : la demande est enregistrée
et le frontend l'indique honnêtement (`emailDeliveryAvailable: false`).

| Variable | Rôle |
| --- | --- |
| `APP_ORIGIN` | origine publique utilisée dans le lien du mail (sinon déduite de la requête) |
| `PASSWORD_RESET_MAX_ATTEMPTS` | demandes de réinitialisation par IP / 15 minutes (défaut 5) |

## Fichiers PDF réels

Les compteurs du catalogue ne sont plus décoratifs :

- `POST /api/submissions/:id/file` enregistre le **PDF réellement déposé** (corps brut
  `application/pdf`, nom d'origine dans `x-file-name`). Le fichier est refusé s'il dépasse
  `MAX_UPLOAD_BYTES` (413), s'il n'a pas la signature `%PDF-` (415) ou sans session/CSRF (401/403).
  Le PDF est écrit dans `UPLOADS_DIR` et suit le dossier lors de la validation (copie vers le
  document publié).
- `GET /api/documents/:id/file` sert le PDF du document : le **fichier déposé** s'il existe, sinon un
  PDF **généré à la volée** depuis les métadonnées (`src/lib/pdfGenerator.ts`, `pdf-lib` : couverture,
  résumé, mots-clés — aucune dépendance côté navigateur, le module n'est importé que par le serveur).
- `GET /api/documents/:id/download` incrémente le compteur **téléchargements** ;
  `POST /api/documents/:id/view` incrémente le compteur **consultations** (appelé à l'ouverture de
  la fiche document) ; `GET /api/documents/:id/certificate` produit l'**attestation officielle en
  PDF** (plus aucune alerte factice côté client).
- Les écritures SQLite sont **ciblées** (une entrée à la fois) : la réécriture complète du catalogue
  à chaque action dépassait le délai d'attente du client dès quelques dizaines de documents.
- Le PDF de l'auteur est déposé par le **Studio de dépôt** (`src/components/SubmissionStudio.tsx`),
  qui vérifie le format et la taille avant envoi. Écran de dépôt **actuellement masqué** (le dépôt
  public est réservé aux établissements partenaires) : en attendant, l'envoi du fichier se fait par
  l'API (dépôt → `POST /api/submissions`, puis `POST /api/submissions/:id/file`).

## API

| Méthode | Route | Accès |
| --- | --- | --- |
| GET | `/api/health` | public |
| GET | `/api/auth/config` | public (identifiants démo si `ENABLE_DEMO_LOGIN`) |
| POST | `/api/auth/login`, `/api/auth/register` | public (rate limité) |
| GET | `/api/auth/me` | public → `{ user: null }` si non connecté |
| POST | `/api/auth/logout` | session + CSRF |
| POST | `/api/auth/forgot-password` | public (rate limité) |
| POST | `/api/auth/reset-password` | public (rate limité, jeton à usage unique) |
| GET | `/api/catalog`, `/api/catalog/:id` | public |
| POST | `/api/catalog/:id/bookmark` | public |
| POST | `/api/submissions` | session + CSRF |
| GET | `/api/validation`, `/api/validation/:id` | session Bibliothécaire ou Administrateur |
| POST | `/api/validation/:id/approve`, `/request-corrections`, `/reject`, `/mesh` | session Bibliothécaire ou Administrateur + CSRF |
| POST | `/api/submissions/:id/file` | session + CSRF (corps brut `application/pdf`) |
| POST | `/api/documents/:id/view` | session + CSRF |
| GET | `/api/documents/:id/file`, `/download`, `/certificate` | session |
| GET | `/api/requests` | session Bibliothécaire ou Administrateur |
| POST | `/api/requests` | session + CSRF |
| POST | `/api/requests/:id/status` | session Bibliothécaire ou Administrateur + CSRF |
| GET | `/api/users` | session Administrateur |
| POST | `/api/users` (ouverture d'un compte par l'administration) | session Administrateur + CSRF |
| PATCH | `/api/users/:id` (rôle / statut) | session Administrateur + CSRF |
| POST | `/api/partnerships` (formulaire « Devenir partenaire ») | public (rate limité) |
| GET | `/api/partnerships` | session Administrateur |
| PATCH | `/api/partnerships/:id` (statut / motif) | session Administrateur + CSRF |
| GET | `/api/audit-logs` | session Administrateur ou Bibliothécaire |
| GET | `/api/observatory` | public |
| POST | `/api/assistant/chat` | public (rate limité) |

## Mode production

```bash
npm run build                 # frontend → dist/
NODE_ENV=production PORT=3000 node_modules/.bin/tsx server.ts
```

En `NODE_ENV=production` le serveur sert `dist/` et n'active pas le middleware Vite.

Variables utiles : `PORT`, `NODE_ENV`, `DATABASE_URL`, `GEMINI_API_KEY`, `CORS_ORIGINS`
(origines autorisées séparées par des virgules), `ASSISTANT_MAX_REQUESTS_PER_MINUTE`,
`ENABLE_DEMO_LOGIN`, `DEMO_LOGIN_PASSWORD`, `COOKIE_SECURE`, `LOGIN_MAX_ATTEMPTS`,
`RESEND_API_KEY`, `PARTNER_ADMIN_EMAIL`, `PARTNER_EMAIL_FROM`, `PARTNERSHIP_MAX_PER_HOUR`,
`APP_ORIGIN`, `PASSWORD_RESET_MAX_ATTEMPTS`, `UPLOADS_DIR`, `MAX_UPLOAD_BYTES`.

Les PDF déposés vivent dans `data/uploads/` (créé au démarrage, ignoré par Git) : ce dossier doit
être sauvegardé avec la base et accessible en écriture par le processus Node.

En production, servir l'application en **HTTPS** : le cookie de session est émis avec le drapeau
`Secure` par défaut (`COOKIE_SECURE=false` uniquement pour un test local en `NODE_ENV=production`
sans TLS).

## Scripts

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Serveur Express + middleware Vite (développement) |
| `npm run build` | Build du frontend |
| `npm run lint` | `tsc --noEmit` |
| `npm run clean` | Supprime `dist/` et `server.js` |
