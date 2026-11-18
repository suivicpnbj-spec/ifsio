# PRODUCTION CHECKLIST — CNTRSS

## Déjà prêt

### Frontend
- Application React fonctionnelle : catalogue, filtres, grille/liste, favoris, observatoire, assistant, dépôt, demandes documentaires.
- `CatalogView`, `ObservatoryAnalytics`, `ResearchAssistant`, `Dashboard` prêts.
- Build client valide : `npm run build`.

### Backend
- `server.ts` expose les routes suivantes :
  - `GET /api/health`
  - `GET /api/catalog`
  - `GET /api/catalog/:id`
  - `POST /api/catalog/:id/bookmark`
  - `POST /api/submissions`
  - `GET /api/validation`
  - `GET /api/validation/:id`
  - `POST /api/validation/:id/approve`
  - `POST /api/validation/:id/request-corrections`
  - `POST /api/validation/:id/reject`
  - `POST /api/validation/:id/mesh`
  - `POST /api/submissions/:id/file` (PDF réel, corps brut)
  - `POST /api/documents/:id/view`
  - `GET /api/documents/:id/file`, `/download`, `/certificate` (PDF / attestation)
  - `GET /api/requests`
  - `POST /api/requests`
  - `POST /api/requests/:id/status`
  - `POST /api/assistant/chat`
  - `GET /api/auth/config`
  - `POST /api/auth/login`
  - `POST /api/auth/register`
  - `POST /api/auth/logout`
  - `POST /api/auth/forgot-password`
  - `POST /api/auth/reset-password`
  - `GET /api/auth/me`
  - `GET /api/users`
  - `POST /api/users` (ouverture de compte par l'administration)
  - `PATCH /api/users/:id`
  - `POST /api/partnerships` / `GET /api/partnerships` / `PATCH /api/partnerships/:id`
  - `GET /api/audit-logs`
- Authentification par **sessions serveur** (cookies httpOnly + anti-CSRF) et contrôle RBAC
  (`requireAuth` / `requireRole`) : voir « Authentification réelle » ci-dessous.

### Validation effectuée dans ce contexte
- Build frontend : OK.
- Correction des doublons collés dans `server.ts`.
- Validation de la logique protégée :
  - sans session → refus 401
  - session Bibliothécaire (cookie httpOnly) → action autorisée et mise à jour du statut
  - session valide mais sans en-tête `x-csrf-token` → refus 403 (anti-CSRF)

---

## À faire — Backend

### 1. Serveur réel en production
- Déployer un serveur Node capable de servir `server.ts`.
- En décider : soit builder le backend en JS, soit déporter `tsx` côté serveur.
- Exposer le port de façon explicite en prod avec `PORT`.

### 2. Variables d’environnement
- `GEMINI_API_KEY` si l’assistant doit appeler Gemini.
- `DATABASE_URL` pour Prisma (base SQLite par défaut).
- `PORT` explicite.
- `NODE_ENV=production` pour activer le mode dist / SPA.
- `RESEND_API_KEY` (e-mails : demandes de partenariat, liens de réinitialisation), `PARTNER_ADMIN_EMAIL`,
  `PARTNER_EMAIL_FROM`.
- `APP_ORIGIN` : origine publique du lien de réinitialisation (sinon déduite de la requête).
- `UPLOADS_DIR` : dossier des PDF déposés (`data/uploads` par défaut) — **à sauvegarder avec la base**,
  et `MAX_UPLOAD_BYTES` (15 Mo par défaut).
- Éventuellement `APP_URL` si utilisé par des liens externes ou OAuth.

### 3. Authentification réelle
- Fait : tokens démo `x-user-token` remplacés par des **sessions serveur** :
  - mot de passe haché en **scrypt** (`node:crypto`, sel aléatoire, comparaison à temps constant) ;
  - session stockée en base (`model Session`) référencée par un cookie `httpOnly` ;
  - jeton anti-CSRF exigé sur les mutations authentifiées ;
  - RBAC aligné sur les rôles réels (`Étudiant`, `Enseignant-Chercheur`, `Chercheur`,
    `Bibliothécaire`, `Administrateur`, `Institution`) ;
  - comptes `En attente de validation` / `Suspendu` refusés à la connexion, sessions révoquées
    lors d’une suspension ;
  - rôles privilégiés non auto-attribuables à l’inscription.
- Fait : **réinitialisation du mot de passe** par e-mail (`POST /api/auth/forgot-password` → jeton
  aléatoire de 32 octets à usage unique, empreinte SHA-256 en base, expiration 30 min ;
  `POST /api/auth/reset-password` → nouveau hachage scrypt + révocation de toutes les sessions),
  réponse identique que le compte existe ou non (pas d'énumération), quota par IP.
- Reste à faire :
  - changement de mot de passe depuis l'espace connecté (hors réinitialisation par lien) ;
  - désactiver les comptes de démonstration (`ENABLE_DEMO_LOGIN=false`) et changer
    `DEMO_LOGIN_PASSWORD` ;
  - envisager 2FA / SSO institutionnel pour les comptes Bibliothécaire et Administrateur ;
  - journaliser les connexions dans un SIEM si exigé.

### 4. Persistance des données
- Fait : migration des `data/*.json` vers une vraie base **SQLite via Prisma**
  (`prisma/schema.prisma`, client généré, seed depuis le corpus frontend,
  écritures dans `server.ts` via `src/lib/prismaMappers.ts`).
- Reste à faire :
  - backup / purge du fichier `prisma/dev.db` en production
  - passer à PostgreSQL (`provider = "postgresql"`) si plusieurs instances
  - vérifier que les écritures concurrentes sont gérées si plusieurs instances.

### 5. Sécurité et robustesse
- CORS explicite (origines autorisées en prod).
- Rate limiting : `/api/assistant/chat` et **tentatives de connexion/inscription**
  (`LOGIN_MAX_ATTEMPTS` par IP et par 15 min).
- Protection CSRF sur les mutations authentifiées (double soumission cookie/en-tête).
- Cookies de session `httpOnly` + `SameSite=Lax` + `Secure` en production (`COOKIE_SECURE`).
- Limites de taille de body.
- Timeouts.
- Validation stricte des payloads.
- Pas de fuite d’informations dans les erreurs en prod.

### 6. Observabilité
- Logs structurés ou au moins utilisables en prod.
- Healthcheck utilisable par un orchestrateur.
- Métriques si besoin (documents, files, quotas, état Gemini).

### 7. Gestion de l’IA
- Vérifier l’accès réseau sortant vers l’API Gemini en prod.
- Prévoir fallback robuste si Gemini indisponible.
- Surveiller quota et coût.

---

## À faire — Frontend

### 1. Alimenter le catalogue depuis le backend réel
- `CatalogView` et `Dashboard` doivent utiliser les données live une fois le backend distant disponible.
- Supprimer ou réduire le fallback local si le comportement produit attendu est basé sur le backend.

### 2. Gestion d’erreurs API
- Remplacer les fallbacks silencieux par des états d’erreur clairs.
- Feedback utilisateur si `/api/catalog`, `/api/observatory`, `/api/assistant/chat` échouent.

### 3. Documentation
- Compléter `README.md` avec :
  - routes
  - variables d’environnement
  - instructions backend
  - mode démo vs mode production
- Uniformiser ce que disent les écrans publics vs la réalité technique.

### 4. Nettoyage des données statiques placeholder
- Vérifier si certains mock restent utiles en prod ou s’ils doivent être retirés / remplacés.

---

## Déploiement / Devops — préparé

### 1. Build et exécution
- ~~Préparer le build du backend~~ → fait : `npm run build` bundle le serveur avec
  esbuild (`dist/server.mjs`, packages externes) ; `npm start` exécute ce bundle.
  `node server.ts` directement ne fonctionnait pas (`ERR_UNSUPPORTED_DIR_IMPORT`) ;
  les chemins de projet (`prisma/`, `data/uploads`, `dist/`) sont résolus via
  `ROOT_DIR` pour fonctionner depuis `dist/`.
- Préparer le frontend via `npm run build` (inclus dans la même commande).
- Artefacts de déploiement VPS dans `deploy/` : `DEPLOIEMENT.md` (procédure
  complète), `env.production.example`, `cntrss.service` (systemd durci),
  `nginx-cntrss.conf` (reverse proxy HTTPS), `backup.sh` (cron de sauvegarde
  base + PDF).
- Garde-fous de production ajoutés : `TRUST_PROXY` (rate limiting / audit avec
  la vraie IP derrière nginx) et seed refusant le mot de passe de démonstration
  si `DEMO_LOGIN_PASSWORD` n'est pas défini avec `NODE_ENV=production`.

### 2. Process management
- PM2, systemd, Cloud Run ou équivalent.
- Redémarrage automatique.
- Healthcheck.
- Rotation / agrégation des logs.

### 3. Réseau
- HTTPS.
- Domaine / CNAME.
- CORS par origine réelle.
- Exposition contrôlée du backend.

### 4. Mise à jour
- Stratégie de rollback.
- Déploiement sans interruption si requis.

---

## Vérifié dans ce contexte

- `npm run lint` (`tsc --noEmit`) : 0 erreur.
- `npm run build` : OK (le module PDF `pdf-lib` n'est pas embarqué dans le bundle client).
- **Cinq fonctions ajoutées vérifiées de bout en bout** (serveur `NODE_ENV=test` sur port 3100) :
  - *suite API* : **81 assertions, 0 échec** — traitement des partenariats (statuts/404/403), refus
    d'un dépôt (motif obligatoire, non publication), création de comptes par l'admin (201/409/400/403,
    aucune fuite de `passwordHash`), réinitialisation du mot de passe (jeton haché, TTL 30 min,
    rejeu/expiration refusés, ancien mot de passe invalidé, sessions révoquées, aucune énumération),
    et fichiers PDF (415 sur contenu non-PDF, 413 au-delà de la limite, 401/403 sans session/CSRF,
    octets du PDF servi **identiques** au fichier déposé, compteurs vues/téléchargements incrémentés
    et écrits en base, attestation PDF contenant le sceau `CERT-CNTRSS-…`).
  - *suite navigateur* (Chrome headless via CDP) : **49 assertions, 0 échec** — lien `#reset=…` qui
    ouvre le formulaire et se retire de l'URL, formulaire « Mot de passe oublié ? », téléchargement
    d'un **vrai fichier PDF** (vérifié sur disque : signature `%PDF-`, taille > 1 Ko) et compteur
    incrémenté dans la fiche, attestation PDF téléchargée, refus d'un dépôt (notification + statut),
    création de compte par l'admin (compte présent dans le répertoire), traitement d'une demande de
    partenariat depuis l'interface.
  - *latences mesurées* : réécriture complète du catalogue supprimée (un refus passait de ~12,6 s à
    moins d'1 s) ; les écritures sont désormais ciblées par enregistrement.
  - *DOI* : séquence persistante + vérification d'unicité (`allocateDoi`) — un redémarrage du serveur
    ne réattribue plus un DOI déjà utilisé (cause d'un 500 au dépôt constatée en test).
- `npm run db:push` puis `npm run db:seed` : base SQLite recréée et alimentée (8 documents, 4 validations,
  3 demandes, 6 comptes avec empreinte `scrypt`).
- Suite HTTP (55 assertions, `curl` avec jar de cookies) sur serveur `NODE_ENV=production` (port 3100) :
  - `/api/auth/me` anonyme → 200 `{ user: null }` ; cookie de session falsifié → session rejetée ;
  - ancien en-tête `x-user-token: demo-biblio` → 401 : le mode démo a bien disparu ;
  - mot de passe erroné ou compte inexistant → 401 ; compte `En attente de validation` → 403 ;
  - connexion Bibliothécaire → 200 + cookie `cntrss_session` (`HttpOnly; SameSite=Lax; Secure`) et cookie `cntrss_csrf` ;
  - `POST /api/validation/:id/approve` sans jeton CSRF → 403, jeton falsifié → 403, session + jeton → 200 ;
  - `GET /api/validation`, `/api/requests`, `/api/users`, `/api/audit-logs` : 401 sans session, 403 sans le bon rôle ;
  - inscription : rôle `Bibliothécaire` → 403, mot de passe < 8 caractères → 400, inscription valide → 201 + session ;
  - `GET /api/users` (admin) → 7 comptes, aucune fuite de `passwordHash` ni d'empreinte `scrypt$` ;
  - suspension d'un compte par l'admin → 200, session du compte révoquée, connexion refusée (403) ;
    auto-suspension de l'administrateur → 409 ;
  - `POST /api/submissions` anonyme → 401, avec session + CSRF → 201 (écriture confirmée en base) ;
  - `POST /api/auth/logout` → 200, session supprimée en base, cookie réutilisé → 401 ;
  - session toujours valide après **redémarrage** du serveur (sessions en base, pas en mémoire) ;
  - `COOKIE_SECURE` par défaut en production → `Set-Cookie: … HttpOnly; Secure` ;
  - `ENABLE_DEMO_LOGIN=false` → `/api/auth/config` sans identifiants, connexion classique toujours fonctionnelle.
- Parcours navigateur réel (Chrome headless piloté via CDP, 21 assertions) :
  - page publique rendue et sélecteur de démo alimenté par `/api/auth/config` ;
  - connexion « Étudiant » depuis l'interface → session serveur, espace de travail rendu, `document.cookie`
    ne contient **pas** `cntrss_session` (httpOnly) mais contient `cntrss_csrf` ;
  - déconnexion via le menu profil → session supprimée côté serveur ;
  - connexion « Bibliothécaire » → même mutation refusée en 403 sans jeton CSRF, puis acceptée via le bouton
    « Valider & Publier au Catalogue National » (le client SPA envoie le jeton) ;
  - déconnexion depuis le bandeau bibliothécaire → session révoquée.
- Vérification directe en base (Prisma) : comptes avec empreintes `scrypt$…`, dépôt de test présent, journal
  d'audit contenant connexions/déconnexions et validations avec le nom réel de l'utilisateur.
- Base remise à l'état seedé après les tests (8/4/3/6), serveurs arrêtés, ports libérés.

## Non vérifiable ici

- Le port 3000 est occupé sur cette machine : les tests ont été faits sur le port 3100.
- Appels réels à Gemini (`/api/assistant/chat`) : non exécutés (pas de `GEMINI_API_KEY`).
- HTTPS, domaine, PM2/systemd/Cloud Run : à valider sur l'instance déployée (le cookie `Secure` exige du TLS).

---

## Priorité recommandée

1. Préparer un serveur backend déployable.
2. Configurer l’environnement réel (`GEMINI_API_KEY`, `PORT`, `NODE_ENV`).
3. ~~Remplacer l’auth démo par une auth de production~~ → fait (sessions serveur, scrypt,
   cookies httpOnly, anti-CSRF) ; reste la gestion des mots de passe et le SSO.
4. Activer le catalogue live côté frontend et retirer les fallbacks inadaptés.
5. Ajouter CORS, rate limiting, logs, healthcheck.
6. Déployer et tester les routes réelles.
