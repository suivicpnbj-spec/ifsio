# Dossier de présentation IFSIO

Cette copie rassemble le site public, l’espace étudiant, l’administration et le service PostgreSQL pour la démonstration. Elle n’embarque ni `node_modules`, ni mots de passe de configuration, ni fichiers téléversés. Les données visibles dans les comptes de démo sont fictives et signalées `[DÉMO]`.

## Redémarrer les deux applications

Après un redémarrage de l’ordinateur, ouvre un terminal et lance :

```sh
cd /home/i45/1/ifsio-site/presentation
./demarrer-tout.sh
```

Le script lance d’abord IFSIO, puis MES RESULTATS, attend que les services répondent et affiche les liens pour l’ordinateur et le réseau Wi‑Fi local. Au premier lancement, il peut installer les dépendances IFSIO. PostgreSQL local est démarré automatiquement si nécessaire. Garde cette fenêtre ouverte pendant la présentation ; `Ctrl+C` arrête les deux applications.

## Démarrer uniquement IFSIO

Si tu veux démarrer seulement le site et le portail IFSIO :

```sh
./start-presentation.sh
```

Le script prépare une configuration locale privée, installe les dépendances si nécessaire, démarre PostgreSQL local, applique les migrations, réinitialise les données de démonstration et lance le site sur [http://localhost:8082](http://localhost:8082). `Ctrl+C` arrête le serveur web. Le dossier complet de l’application est dans `ifsio-site/`.

Administration : [http://localhost:8082/administration.html](http://localhost:8082/administration.html)  
Espace étudiant : [http://localhost:8082/espace-apprenants.html](http://localhost:8082/espace-apprenants.html)

## Comptes de démonstration

Les identifiants sont dans [IDENTIFIANTS-DEMO.txt](IDENTIFIANTS-DEMO.txt). Ils ne concernent que la base locale. Les comptes étudiants, le matricule, les cours, l’annonce et l’événement sont fictifs.

La commande `npm run demo:seed` recrée ces comptes et exemples dans `ifsio_portal_local`. Le script refuse une base qui ne porte pas le suffixe `_local` et refuse le mode production.

## Contenu du dossier

- `ifsio-site/refonte/` : fichiers du site public et des interfaces étudiant / administration.
- `ifsio-site/portal-service/` : API Node, migrations PostgreSQL et scripts de démarrage.
- `demarrer-tout.sh` : lance IFSIO et MES RESULTATS ensemble.
- `start-presentation.sh` : lancement local complet de la démo.

MES RESULTATS reste un projet séparé. Le bouton du portail étudiant ouvre `http://localhost:5174` ; il faut démarrer ce projet séparément si sa démonstration est souhaitée.
