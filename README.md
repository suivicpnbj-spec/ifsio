# Campus Numérique Intégré IFSIO — Université de Parakou

Ce répertoire regroupe l'ensemble des plateformes numériques interconnectées de l'**Institut de Formation en Soins Infirmiers et Obstétricaux (IFSIO)** de l'Université de Parakou.

---

## 🏛️ Architecture & Convergence des Plateformes

| Plateforme | Dossier | Rôle & Fonctionnalités Clés | Stack Technique | Ports Locaux |
| :--- | :--- | :--- | :--- | :--- |
| **Site Vitrine & Portail Étudiant** | `ifsio-site/` | Hub institutionnel, actualités, formations, espace apprenants & passerelle satellites | Express 5, PostgreSQL 16, Vanilla ES Modules | `8081` (API + Web) |
| **eRésultats IFSIO** | `resultats-ifsio-app/` | Consultation des notes semestrielles, délibérations, crédits ECTS, scellé cryptographique d'admissibilité (`/api/interne/admissibilite/:matricule`) | Node.js Express, PostgreSQL, React Vite | `3000` (API) / `5174` (Front) |
| **Mes Actes Académiques** | `mes-actes/` | Guichet d'actes certifiés avec QR code, passerelle jury eRésultats, portail public anti-fraude (`/#/verifier`), paiements mobiles | React 19, Express, SQLite / PostgreSQL, FeeXPay / CinetPay | `4000` (API) / `5173` (Front) |
| **CNTRSS Catalogue** | `cntrss-catalogue/` | Bibliothèque numérique des mémoires et thèses paramédicales & obstétricales avec recherche sémantique | Node.js tsx, Prisma, React 19, IA GenAI | `3100` (API + Front) |

---

## 🛡️ Fonctionnalités de Sécurité & Anti-Fraude Déployées

1. **Pont d'Admissibilité eRésultats $\leftrightarrow$ Mes Actes :**
   - Route interne scellée : `GET http://localhost:3000/api/interne/admissibilite/:matricule`
   - Protégée par jeton partagé `CAMPUS_INTERNAL_SECRET`.
   - Fournit l'historique officiel du jury (décision, crédits ECTS, moyenne générale, mention et scellé HMAC-SHA256).

2. **Générateur d'Actes Certifiés avec QR Code Réel :**
   - Composant vectoriel institutionnel conforme aux normes de la République du Bénin (entête tricolore vert-jaune-rouge, armoiries, visa du Directeur).
   - QR code haute densité scannable contenant l'URL de vérification publique et l'empreinte de sécurité.

3. **Portail Public Anti-Fraude en Ligne :**
   - Route publique : `GET /api/public/verify/:code`
   - Page dédiée : `http://localhost:5173/#/verifier`
   - Permet aux employeurs, ambassades et universités tierces de valider l'authenticité d'une attestation ou d'un relevé de notes en saisissant le numéro de dossier ou en scannant le QR code.

---

## 🚀 Modes de Démarrage

### Mode 1 : Démarrage Local Natif (Recommandé en Développement & Démo Hors Ligne)

```bash
cd /home/i45/campus-ifsio
./demarrer-les-4-plateformes.sh
```
*Le raccourci bureau **« Démarrer les 4 plateformes »** pointe également directement sur ce script.*

### Mode 2 : Conteneurisation Docker Compose (Production & Déploiement Cloud)

```bash
cd /home/i45/campus-ifsio
./demarrer-docker.sh
```
Pour arrêter l'ensemble des conteneurs :
```bash
./arreter-docker.sh
```

---

## 🔗 Liens de Compatibilité & Rétrocompatibilité

Pour préserver le fonctionnement des raccourcis système et des scripts préexistants, des liens symboliques transparents sont maintenus :
- `/home/i45/1/ifsio-site` ➔ `ifsio-site`
- `/home/i45/1/resultats-ifsio-app` ➔ `resultats-ifsio-app`
- `/home/i45/Actes/mes-actes` ➔ `mes-actes`
- `/home/i45/Catalogue` ➔ `cntrss-catalogue`
- `/home/i45/1/demarrer-les-4-plateformes.sh` ➔ `demarrer-les-4-plateformes.sh`
- `/home/i45/Bureau/Démarrer les 4 plateformes.desktop` mis à jour vers le chemin unifié.

---

## ⚙️ Configuration & Variables d'Environnement

Dans `ifsio-site/portal-service/.env.local`, les URLs des services satellites sont configurables dynamiquement :
- `RESULTATS_URL=http://localhost:5174`
- `ACTES_URL=http://localhost:5173`
- `CNTRSS_URL=http://localhost:3100`

L'endpoint `GET /api/public/config` fournit automatiquement cette configuration au portail étudiant front-end (`espace-apprenants.html`).
