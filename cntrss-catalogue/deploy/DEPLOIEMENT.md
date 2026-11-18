# Déploiement CNTRSS — VPS Linux (Debian/Ubuntu)

Procédure complète pour mettre en production sur un VPS. Les fichiers cités
sont dans `deploy/`.

## 0. Prérequis

- VPS Debian/Ubuntu avec un domaine pointant dessus (exemple : `cntrss.bj`).
- Node.js 22+ (`apt install nodejs npm` ou nvm), nginx, cron.
- Compte système dédié : `useradd -r -m -d /var/lib/cntrss cntrss`.

## 1. Installation de l'application

```bash
# Code applicatif (rsync du dossier projet hors node_modules et dist) :
sudo rsync -a --exclude node_modules --exclude dist ./ /opt/cntrss/
sudo chown -R cntrss:cntrss /opt/cntrss
cd /opt/cntrss

# Dépendances, build client + serveur, base initialisée :
sudo -u cntrss npm ci
sudo -u cntrss npm run build          # vite build + bundle esbuild -> dist/
sudo mkdir -p /var/lib/cntrss/prisma /var/lib/cntrss/uploads
sudo chown -R cntrss:cntrss /var/lib/cntrss
```

## 2. Environnement

```bash
sudo cp deploy/env.production.example /opt/cntrss/.env
sudo chown cntrss:cntrss /opt/cntrss/.env
sudo chmod 600 /opt/cntrss/.env
# Compléter : DEMO_LOGIN_PASSWORD (openssl rand -base64 18), APP_ORIGIN,
# DATABASE_URL et UPLOADS_DIR vers /var/lib/cntrss, clés Gemini/Resend.
```

Points de vigilance :

- `ENABLE_DEMO_LOGIN=false` : les boutons de connexion rapide disparaissent et
  `/api/auth/config` n'expose plus aucun identifiant.
- `TRUST_PROXY=1` : requis derrière nginx, sinon tout le monde partage l'IP du
  proxy et le rate limiting par IP devient inopérant.
- `COOKIE_SECURE=true` (défaut en production) : exige HTTPS, sinon le
  navigateur rejette le cookie de session et la connexion échoue silencieusement.

## 3. Base de données et comptes

```bash
sudo -u cntrss npx prisma db push    # crée les tables dans DATABASE_URL
sudo -u cntrss npm run db:seed       # 6 comptes, catalogue vide
```

Le seed **refuse de tourner en production** si `DEMO_LOGIN_PASSWORD` vaut encore
la valeur de démonstration : c'est voulu, communiquez le mot de passe généré
aux titulaires des comptes (bibliothécaire et administrateur surtout) et faites-les
changer leur mot de passe par réinitialisation par e-mail.

## 4. Service système et reverse proxy

```bash
sudo cp deploy/cntrss.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now cntrss
sudo systemctl status cntrss

sudo cp deploy/nginx-cntrss.conf /etc/nginx/sites-available/cntrss
# Adapter le domaine, puis :
sudo ln -s /etc/nginx/sites-available/cntrss /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d cntrss.bj
```

## 5. Sauvegardes

```bash
sudo chmod +x deploy/backup.sh
sudo crontab -u cntrss
# 0 3 * * * /opt/cntrss/deploy/backup.sh >> /var/log/cntrss-backup.log 2>&1
```

La sauvegarde couvre la base SQLite et les PDF déposés (`/var/lib/cntrss`) :
ce sont les deux seuls états à conserver. Tester une restauration au moins une
fois : `systemctl stop cntrss`, restauration des fichiers, `systemctl start cntrss`.

## 6. Mise à jour d'une version

```bash
cd /opt/cntrss
sudo -u cntrss npm ci && sudo -u cntrss npm run build
sudo -u cntrss npx prisma db push    # si le schéma a changé
sudo systemctl restart cntrss
curl -fsS http://127.0.0.1:3000/api/health | head -c 200
```

Rollback : conserver l'ancienne version dans `/opt/cntrss.releases/<date>/` et
remettre l'ancien `dist/` + `node_modules/`, puis redémarrer.

## 7. Contrôles post-déploiement

- `GET /api/health` répond (base disponible, compteurs à zéro ou cohérents).
- Connexion avec un compte réel depuis le domaine public (cookie `Secure` présent).
- `GET /api/auth/config` : `demoLoginEnabled: false`, aucune identité exposée.
- `POST /api/submissions` avec un compte étudiant → 403 ; via la console
  bibliothécaire → import possible.
- Les e-mails (partenariat, réinitialisation) partent si `RESEND_API_KEY` est
  renseignée ; sinon l'absence est journalisée sans casser le parcours.
