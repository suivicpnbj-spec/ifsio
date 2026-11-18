# Plateforme de résultats académiques IFSIO

Plateforme de consultation des résultats académiques pour l'IFSIO (Université de Parakou),
conforme au cahier des charges v1.0. Backend API REST **et** application frontend connectée.

## Stack

- **Backend** — Node.js / Express API REST, PostgreSQL, JWT, ExcelJS (import), PDFKit (relevés)
- **Frontend** — React + Vite, connecté à l'API (espaces scolarité et étudiant)
- **Tests** — `node:test` (unitaires, sans base de données requise)

## Démarrage rapide

```bash
# 1. Backend — installer et configurer
npm install
cp .env.local.example .env.local

# 2. Base PostgreSQL bêta sur Supabase
# Copier l'URI complète « Session pooler » depuis Dashboard Supabase → Connect
# et la coller comme DATABASE_URL dans .env.local (garder DATABASE_SSL=true).
DOTENV_CONFIG_PATH=.env.local npm run migrate:db

# 3. Lancer l'API
DOTENV_CONFIG_PATH=.env.local npm run dev  # http://localhost:3000

# 4. Frontend (autre terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5174 (proxy /api → :3000)
```

La base bêta Supabase contient les données de démonstration et le test ESSFE L1
IDE. Elle reste une base de bêta et ne doit pas servir à la production.

## Mise en production

Le projet peut être déployé sur un **PaaS**. En production, le
backend **sert aussi le frontend compilé** (`frontend/dist`).

Le blueprint (`render.yaml`) déploie **deux services web séparés**, chacun
imposant **son** espace via la variable `ENTREE_DEFAUT` :

| Service | `ENTREE_DEFAUT` | Ce que voit l'utilisateur |
|---|---|---|
| `eresultat-ifsioscol` | `scolarite` | accueil + carte et connexion scolarité uniquement |
| `eresultat-etudiant` | `etudiant` | accueil + carte et connexion étudiant uniquement |

Les deux partagent la même base PostgreSQL. L'application lit `GET /api/config`
(`{ entree }`) au démarrage : la **racine affiche toujours la page d'accueil**
(présentation, fonctionnalités, puis la **carte unique** de l'espace imposé —
l'autre espace reste invisible). `#/etudiant` / `#/scolarite` mènent à l'entrée
(formulaire de connexion) ; sans contrainte (développement local), l'accueil
propose les deux espaces et le routage par hash reste actif.

### Déploiement sur Render (recommandé)

1. **Créer un compte** sur <https://render.com> et pousser ce dépôt sur GitHub.
2. **New → Blueprint** → choisir le dépôt : `render.yaml` crée les deux services
   web et demande `DATABASE_URL`. Configure la même URL de base PostgreSQL de
   production sur les deux services. Ne colle pas l'URL de la base bêta.
3. Render génère un **JWT_SECRET aléatoire**. Les migrations SQL s'appliquent
   automatiquement au démarrage (`db/migrate.js`) avec un verrou PostgreSQL pour
   éviter les exécutions simultanées. Le frontend est compilé dans l'image.

4. **Compte scolarité initial** : crée-le depuis un terminal sécurisé après
   avoir configuré la base cible. La commande demande nom, email, mot de passe
   masqué et confirmation du nom de la base. Elle refuse de créer un second
   administrateur. Ne lance jamais le seed de démonstration en production.

   ```sh
   NODE_ENV=production DOTENV_CONFIG_PATH=/dev/null npm run admin:bootstrap -- --confirm-production
   ```

   Injecte `DATABASE_URL` et `DATABASE_SSL=true` temporairement dans cet
   environnement sécurisé. Ne place pas les secrets dans le dépôt ou la ligne
   de commande. Exécute la commande une fois, avec accès à la base de production.

5. **HTTPS automatique** : l'URL `*.onrender.com` est servie en HTTPS.
   Ajouter un nom de domaine plus tard : Dashboard → service → Settings →
   Custom Domain (2 enregistrements DNS : CNAME + TXT).
6. **Santé** : le `healthCheckPath` `/api/sante` évite les redémarrages intempestifs.

### Variables d'environnement en production

| Variable | Production |
|---|---|
| `NODE_ENV` | `production` (défini par Render) |
| `DATABASE_URL` | même URL PostgreSQL de production sur les deux services; jamais l'URL bêta |
| `DATABASE_SSL` | `true` en production : les bases managées exigent SSL (connexion externe) |
| `ENTREE_DEFAUT` | `etudiant` ou `scolarite` : impose l'entrée affichée par le service |
| `JWT_SECRET` | généré aléatoirement (Render `generateValue`) |
| `SMS_PROVIDER_API_URL` | `https://api.africastalking.com/version1/messaging` (production, pas sandbox) |
| `SMS_PROVIDER_USERNAME` | le username réel du compte Africa's Talking |
| `SMS_WEBHOOK_SECRET` | secret aléatoire (obligatoire : sans lui, le webhook renvoie 503) |
| `SMTP_HOST`/`SMTP_PASS` | à remplir pour activer les emails réels (sinon simulation) |

Au démarrage en production, le serveur affiche des **avertissements** en cas de
configuration manquante ou de bac à sable SMS encore actif.

### Sans Docker (Render buildpack, Railway, etc.)

```bash
npm install && npm run build:frontend   # compile frontend/dist
npm start                                # sert l'API ET le frontend sur le port 3000
```

### Checklist avant mise en service

- [ ] `JWT_SECRET` long et aléatoire (≥ 32 caractères)
- [ ] `SMS_PROVIDER_API_URL` pointe vers l'API de production (pas `api.sandbox.`)
- [ ] `SMS_WEBHOOK_SECRET` défini
- [ ] SMS : crédit sur le compte Africa's Talking, SenderID enregistré, numéro court configuré
- [ ] Emails réels activés (SMTP) ou simulation assumée
- [ ] Sauvegarde de la base planifiée (Render → Postgres → Backups, ou pg_dump cron)

## Structure du projet

```
src/
  config/          Configuration (variables d'environnement)
  db/              Pool de connexion PostgreSQL
  middleware/      auth (JWT), validation (Zod), gestion des erreurs
  modules/
    auth/          Connexion étudiant / scolarité, changement de mot de passe
    etudiants/     Gestion des comptes étudiants
    notes/         Saisie, calculs (moyenne/décision), workflow de publication
    import/        Import Excel (analysé, puis écrit via /notes/lot)
    notifications/ Envoi SMS + email à la publication
    resultats/     Génération du relevé de notes PDF
    scolarite/     Référentiel académique (filières, promotions, semestres, matières)
    sms/           Abstraction agrégateur SMS, webhook entrant (pull), signature HMAC
    email/         Canal email SMTP générique (nodemailer)
db/
  migrations/      Schéma SQL, appliqué séquentiellement par db/migrate.js
  seeds/           Données de démonstration
tests/             Tests unitaires (node:test) — sans base de données
frontend/
  src/pages/       Accueil (page d'accueil), Connexion, Espace Scolarité, Espace Étudiant
  src/components/  UI réutilisable (boutons, cartes, sceaux de statut, toasts…)
  src/api.js       Client HTTP de l'API (token JWT, erreurs normalisées)
```

## Le workflow de publication

Toute note suit trois statuts, conformément au cahier des charges :

```
brouillon  →  vérifié  →  publié
```

- **Saisie** (`POST /api/notes` ou `/api/notes/lot`) : crée/modifie une note en statut `brouillon`.
  Corriger une note publiée la repasse automatiquement en `brouillon`.
- **Vérification** (`POST /api/notes/verifier`, rôle `responsable` ou `admin`) : exige une note
  dans chaque matière du semestre pour chaque étudiant actif, puis calcule les agrégats prévus
  par l'application. La décision affichée doit provenir du classeur officiel délibéré; ne publie
  pas une décision calculée automatiquement comme décision du jury.
- **Publication** (`POST /api/notes/publier`) : rend les résultats visibles et déclenche les
  notifications SMS/email. Refuse de publier si les résultats ne sont pas au statut `vérifié`.

Chaque étape est journalisée dans `journal_modification` (auteur, horodatage, valeurs avant/après).
Le journal est consultable côté scolarité (`GET /api/notes/journal`).

## Import de notes (back-office)

L'espace scolarité propose un onglet « Import de notes » acceptant les fichiers **CSV, XLSX et ODS**.
Les parseurs reconnaissent les formats suivants :

- **CSV « format bulletin »** (celui des bulletins officiels ESIIE/ESSFE) : en-têtes avec
  les **codes de matières** (ex. `APG1101`), chaque matière occupant un bloc de colonnes
  (sous-colonnes CC/EF/EC… puis « Moy » et coefficient), puis une ligne par étudiant
  `N° | matricule | NOM PRENOMS | notes`. Le système détecte le séparateur (`;`, `,` ou
  tabulation) et les décimales à virgule, et matche les matières **par code**
  (`matiere.code`, migration 003). Séparateurs et décimales à virgule acceptés.
- **Excel classique** (.xlsx) : colonne A = matricule, colonne B = nom informatif, puis une
  colonne par matière avec le libellé exact en en-tête (matching par libellé). L'analyse est
  limitée à la promotion et au semestre sélectionnés.
- **Grille L1 IDE** (.xlsx) : les en-têtes groupés CC et ET par EC sont analysés et la note
  importée est leur moyenne. Le format ne distingue pas la session de rattrapage, donc il est
  accepté uniquement en session normale. Les colonnes « Total crédits Sx » et « Total crédits
  S1+S2 » sont reprises par étudiant telles quelles, sans exiger de barème de crédits UE dans
  le référentiel. Le barème UE reste facultatif et ne sert qu'à afficher les crédits détaillés
  par UE. Les crédits renseignés UE par UE et les décisions du jury ne sont pas encore pris en
  charge par cet import; si ces cellules sont remplies, l'import est bloqué pour éviter une perte.

Dans les deux cas, le système **analyse sans rien écrire**, affiche un rapport (notes
valides, erreurs de matricule/barème, matières inconnues), puis l'agent confirme l'écriture
en base (workflow brouillon classique). Un fichier d'exemple Excel est fourni :
`exemple-import-notes.xlsx`.

### Référentiel SFE

Le seed fondé sur l'ancien OCR a été retiré : ses données ne sont pas fiables et ne doivent pas
être importées. Le classeur `Classeur_SFE (1).xlsx` est la source de travail du référentiel. Le bêta-test
comprend **ESSFE L1 IDE** (année 2022-2023, notes en brouillon), **ESSFE L2** (année 2023-2024,
semestres 3 et 4) et le référentiel **ESSFE L3** (2025-2026, semestres 5 et 6; sans étudiants ni notes).
Le seed
`npm run seed:beta:essfe-l2` configure les 19 UE, 36 EC et 20 étudiants fictifs de
`Classeur2_complet.ods`; leurs notes finales d'EC sont calculées comme la moyenne de CC et ET
(ou la note ET pour les EC évalués uniquement en ET). Le seed crée aussi un compte de scolarité.
Il est idempotent et refuse `NODE_ENV=production`. L'exécuter réactive l'année 2023-2024 et
remet les notes de ces comptes en brouillon.

```sh
NODE_ENV=development npm run migrate:db
NODE_ENV=development npm run seed:beta:essfe-l2
NODE_ENV=development npm run seed:beta:essfe-l3-referentiel
```

Le seed L3 lit les UE, EC et crédits semestriels de `Classeur_SFE (1).xlsx`; il vérifie le total
annoncé de 30 crédits pour chaque semestre et n'invente ni liste d'étudiants ni notes.

Comptes de test (mot de passe initial `BetaTest2024!`) :
`beta-scolarite@ifsio.test` et les 20 matricules du classeur.
Les comptes étudiants imposent le changement de mot de passe à la première connexion.

Les notes sont les moyennes arithmétiques de CC et ET. La moyenne d'une UE est la moyenne de
ses notes d'EC ; les crédits détaillés d'une UE sont affichés si son barème est configuré. Le
total officiel de crédits du semestre et de l'année est repris directement du classeur lorsqu'il
est fourni. La moyenne générale du semestre est la moyenne simple des moyennes d'UE. Les résultats
importés en brouillon ne sont pas visibles des étudiants tant que la scolarité ne les a pas publiés.

## Canal SMS — Africa's Talking

Le fournisseur retenu est **Africa's Talking** (couvre le Bénin +229).

- **SMS sortant (push)** — envoi d'un SMS à chaque étudiant lors de la publication
  (`POST https://api.africastalking.com/version1/messaging`, en-tête `apiKey`,
  corps form-urlencoded avec `username`, `to`, `message`). Configuration :
  `SMS_PROVIDER_API_URL`, `SMS_PROVIDER_API_KEY` (clé `atsk_…`), `SMS_PROVIDER_USERNAME`
  (nom d'utilisateur du compte, obligatoire), `SMS_SENDER_ID` (SenderID approuvé, vide = code court).
- **SMS entrant (pull)** — `POST /api/sms/entrant` reçoit les messages `MATRICULE PIN` via le webhook
  d'Africa's Talking et répond automatiquement avec la moyenne/décision. Le mapping accepte
  `{ from|phoneNumber, text|message }`. ⚠️ Africa's Talking ne signe pas ses requêtes : en production,
  protéger la route par un proxy ou une restriction d'IP (la vérification HMAC reste activée si
  `SMS_WEBHOOK_SECRET` est renseigné et que l'agrégateur sait signer).

Sans configuration complète, les envois sont journalisés en console (mode simulation).
Test rapide : `npm run test:sms +229XXXXXXXX`.

### Sécurité du webhook (production)

Chaque requête entrante doit porter l'en-tête `X-IFSIO-Signature` contenant
`HMAC-SHA256(body, SMS_WEBHOOK_SECRET)` en hexadécimal. En production, le secret est **obligatoire** :
sans lui ou avec une signature invalide, la requête est rejetée (401/503). En développement, un
avertissement est émis à la place (tolérance locale).

## Canal email

Notification par email à la publication pour les étudiants ayant une adresse renseignée.
Fonctionne avec n'importe quel SMTP (institutionnel, Gmail/Workspace, Resend `smtp.resend.com`…)
via les variables `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`.
`SMTP_HOST` vide → mode simulation (envois journalisés en console).

### Activation avec Resend (recommandé)

1. Créer un compte sur <https://resend.com> et récupérer une clé API (`Dashboard → API Keys`).
2. Option A — **test sans domaine** : laisser `EMAIL_FROM="IFSIO <onboarding@resend.dev>"`
   (les emails partent alors uniquement vers votre propre adresse de compte).
   Option B — **production** : ajouter et vérifier un domaine (`Dashboard → Domains`, 3 enregistrements
   DNS : SPF, DKIM, MX/Return-Path), puis `EMAIL_FROM="IFSIO <no-reply@votre-domaine>"`.
3. Renseigner dans `.env` : `SMTP_HOST=smtp.resend.com`, `SMTP_PORT=465`, `SMTP_SECURE=true`,
   `SMTP_USER=resend`, `SMTP_PASS=<clé API>`.
4. Redémarrer le serveur, puis tester : `npm run test:email vous@exemple.com`.
5. Pour déclencher un envoi via le workflow : renseigner `email` sur un étudiant
   (`UPDATE etudiant SET email='...' WHERE matricule='IFSIO24-014'`) puis publier un semestre.

## Endpoints principaux

| Méthode | Route | Accès | Rôle |
|---|---|---|---|
| POST | `/api/auth/etudiant/connexion` | public | Connexion étudiant |
| POST | `/api/auth/scolarite/connexion` | public | Connexion scolarité |
| POST | `/api/auth/etudiant/changer-mot-de-passe` | étudiant | — |
| POST | `/api/etudiants` | scolarité | Création de compte |
| GET | `/api/etudiants?promotion_id=` | scolarité | Liste d'une promotion |
| POST | `/api/notes` · `/api/notes/lot` | scolarité | Saisie |
| POST | `/api/notes/verifier` · `/publier` | scolarité | `responsable`/`admin` |
| GET | `/api/notes/promotion/:pid/:sid` | scolarité | Tableau complet (back-office) |
| GET | `/api/notes/etudiant/:id/:sid` | scolarité | Notes d'un étudiant (brouillons inclus) |
| GET | `/api/notes/journal` | scolarité | Journal de traçabilité |
| GET | `/api/notes/moi/semestres` | étudiant | Semestres publiés consultables |
| GET | `/api/notes/moi/:sid` | étudiant | Ses résultats publiés |
| GET | `/api/resultats/releve/:sid` | étudiant | Relevé PDF |
| GET | `/api/referentiel/*` | scolarité | Filières, promotions, semestres, matières |
| POST | `/api/sms/entrant` | webhook | SMS entrant `MATRICULE PIN` |

## Sécurité

- Mots de passe et codes PIN hachés avec bcrypt (12 rounds)
- JWT avec expiration (8h par défaut)
- Limitation de débit sur les routes d'authentification (20 tentatives / 15 min)
- En-têtes de sécurité via Helmet
- Un étudiant ne peut consulter que ses propres résultats (vérifié via `req.auth.id`)
- Actions de vérification/publication réservées aux rôles `responsable`/`admin`
- Webhook SMS authentifié par signature HMAC partagée (comparaison à temps constant)

## Tests

```bash
npm test           # tests unitaires des calculs académiques et de la signature webhook
npm run test:email # test d'envoi d'email (SMTP configuré ou mode simulation)
npm run test:sms   # test d'envoi de SMS (Africa's Talking configuré ou mode simulation)
```

Les tests sont volontairement isolés de la base de données (modules purs), pour tourner partout.

## Démarrage local en une commande

Après l’installation initiale et la configuration locale, lancez toute la plateforme avec :

```bash
npm run local
```

Cette commande démarre PostgreSQL local s’il est arrêté, applique les migrations, puis lance l’API et le frontend. Ouvrez `http://localhost:5174`; l’API répond sur `http://localhost:3000`. `Ctrl+C` arrête les serveurs web. PostgreSQL reste actif, car la base locale peut être partagée avec d’autres projets.

## Développement hors ligne (PostgreSQL local)

L’API utilise PostgreSQL directement. Pour le travail hors connexion, une instance PostgreSQL séparée est installée dans `~/.local/share/ifsio-postgres` (port `55432`); elle ne remplace pas et ne modifie pas Supabase. La configuration `.env.offline` est locale et ignorée par Git. Le démarrage unifié ci-dessus utilise les données locales ESSFE L2 (2023–2024), si elles ont été initialement chargées avec `npm run seed:offline:essfe-l2`. Cette base n’est pas synchronisée avec la base distante.

Commandes individuelles utiles : `npm run db:offline:start`, `npm run db:offline:status`, `npm run db:offline:stop`, `npm run migrate:offline` et `npm run dev:offline`.
