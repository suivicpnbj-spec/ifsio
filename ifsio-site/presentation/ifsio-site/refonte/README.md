# Site et portail IFSIO

Le site public, l’espace étudiant et l’administration éditoriale sont servis par le backend IFSIO, avec une base PostgreSQL locale dédiée. Le portail étudiant gère les demandes de compte et leur validation, les annonces, les cours, les ressources téléchargeables et le calendrier. Les contenus saisis sont stockés sur le serveur et rendus en texte pour éviter l’exécution de contenu fourni dans les formulaires.

La navigation reprend les rubriques historiques de l’Institut, de la vie étudiante, des publications et des ressources : messages de la direction, équipes, partenaires, BUE et Association culturelle, insertion professionnelle, communiqués, activités, galerie photos, vidéos et liens utiles. Les pages dont les informations n’étaient pas présentes dans l’archive sont prévues pour être alimentées par l’Institut ; elles n’inventent ni noms ni données institutionnelles. La recherche parcourt les contenus publics publiés.

## Démarrage local

```sh
cd /home/i45/1/ifsio-site/portal-service
npm run local
```

Le service démarre PostgreSQL local s’il est arrêté, applique les migrations puis lance le site sur [http://localhost:8081](http://localhost:8081). L’administration est à [http://localhost:8081/administration.html](http://localhost:8081/administration.html), l’espace étudiant à [http://localhost:8081/espace-apprenants.html](http://localhost:8081/espace-apprenants.html). `Ctrl+C` arrête le service web et laisse PostgreSQL actif pour les autres projets.

Les fichiers téléversés sont conservés dans `portal-service/uploads/`. Les données sont dans la base `ifsio_portal_local`, séparée de MES RESULTATS.

## Comptes

La demande de compte étudiant se fait depuis l’écran de connexion. Chaque demande reste en attente jusqu’à vérification du matricule et activation depuis l’administration. Aucun vrai compte étudiant n’a été importé.

Le compte administrateur de développement local est documenté dans le fichier privé `/home/i45/.local/share/ifsio-portal-admin.txt`. Pour créer un autre administrateur, lancer `npm run admin:create` dans `portal-service` depuis un terminal interactif. Le compte local de démonstration ne doit pas être repris en production.

## Services

- `/api/public` : pages, actualités, activités, recherche et ressources publiques.
- `/api/auth` : demande d’accès, connexion, session et déconnexion.
- `/api/student` : tableau de bord, cours, annonces, calendrier et téléchargement autorisé.
- `/api/admin` : validation des étudiants, gestion éditoriale, cours, événements et téléversements.
- `/api/health` : état du service et de la base.

MES RESULTATS reste une application indépendante et son raccourci local ouvre `http://localhost:5174`. Son démarrage se fait séparément depuis `/home/i45/1/resultats-ifsio-app` avec `npm run local`.

## Avant une mise en ligne

Configurer une base et un stockage de fichiers persistants côté hébergeur, définir `DATABASE_URL`, `SESSION_SECRET`, `UPLOAD_DIR`, `HOST=0.0.0.0` et `NODE_ENV=production`, créer un administrateur institutionnel, puis activer HTTPS et organiser les sauvegardes. Le service actuel est prêt pour le beta test local ; il n’est pas encore déployé sur un hébergeur public.

## Publications et images de couverture

Dans l’administration, choisissez « Actualité ou communiqué » pour créer un article : titre, rubrique, résumé, texte et image de couverture (JPG, PNG ou WEBP). La date est attribuée lors de la publication. Les actualités publiées alimentent la page Actualités et les cartes d’accueil ; une publication classée « BUE » apparaît aussi dans la liste des publications étudiantes. Chaque titre ouvre une page d’article dédiée. Les images sont enregistrées dans `portal-service/uploads/` et ne sont accessibles publiquement que si leur contenu est publié.
