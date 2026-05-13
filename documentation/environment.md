# Variables d'environnement

Copier `env.template` vers `.env` avant de démarrer.

## Application

| Variable | Requis | Défaut | Description |
|---|---|---|---|
| `NODE_ENV` | Non | `development` | `development` \| `production` |
| `PORT` | Non | `3000` | Port d'écoute du serveur |

## Base de données

| Variable | Requis | Exemple | Description |
|---|---|---|---|
| `DATABASE_URL` | **Oui** | `mysql://root:rootpassword@localhost:3306/backend_db` | URL de connexion Prisma (MariaDB) |

## JWT & Tokens

| Variable | Requis | Défaut | Description |
|---|---|---|---|
| `JWT_SECRET` | **Oui** | — | Clé secrète de signature des JWT. Ne jamais exposer. |
| `JWT_EXPIRES_IN` | Non | `900` | Durée de vie de l'access token en secondes (15 min) |
| `REFRESH_TOKEN_EXPIRES_IN` | Non | `604800` | Durée du refresh token en secondes (7 jours) |
| `EMAIL_VERIFY_EXPIRES_IN` | Non | `86400` | Durée du token de vérification email en secondes (24h) |

## URLs

| Variable | Requis | Exemple | Description |
|---|---|---|---|
| `APP_URL` | **Oui** | `http://localhost:3000` | URL publique de l'API (utilisée dans les emails) |
| `FRONTEND_URL` | Non | `http://localhost:3001` | URL du front-office (CORS) |

## Email (SMTP)

| Variable | Requis | Description |
|---|---|---|
| `SMTP_HOST` | **Oui** | Hôte du serveur SMTP |
| `SMTP_PORT` | **Oui** | Port SMTP (ex: 587, 465) |
| `SMTP_USER` | **Oui** | Identifiant SMTP |
| `SMTP_PASS` | **Oui** | Mot de passe SMTP |
| `SMTP_FROM` | **Oui** | Adresse expéditeur (ex: `noreply@monapp.fr`) |

## Kaggle (ETL)

Requis uniquement pour déclencher les pipelines d'import de données.

| Variable | Requis | Description |
|---|---|---|
| `KAGGLE_USER` | **Pour ETL** | Nom d'utilisateur Kaggle |
| `KAGGLE_KEY` | **Pour ETL** | Clé API Kaggle |

## CI / CD

| Variable | Contexte | Description |
|---|---|---|
| `DISCORD_WEBHOOK_URL` | GitHub Actions (vars) | URL du webhook Discord pour les notifications CI. Si absent, la notification est silencieusement ignorée. |

## Docker

En production (compose.yaml), les variables sont passées dans la section `environment`. Ne jamais committer le fichier `.env` — il est dans `.gitignore`.

Exemple minimal pour Docker :
```yaml
environment:
  NODE_ENV: production
  PORT: 3001
  DATABASE_URL: mysql://user:pass@db:3306/backend_db
  JWT_SECRET: un-secret-tres-long-et-aleatoire
  APP_URL: https://api.mondomaine.fr
  SMTP_HOST: smtp.mondomaine.fr
  SMTP_PORT: 587
  SMTP_USER: noreply@mondomaine.fr
  SMTP_PASS: password
  SMTP_FROM: noreply@mondomaine.fr
```
