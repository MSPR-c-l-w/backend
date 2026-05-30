# Variables d'environnement

Copier `.env.example` → `.env` et `.env.secrets.example` → `.env.secrets` avant de démarrer.

Gestion des secrets, rotation JWT, Docker : voir [secrets-management.md](secrets-management.md).

## Application

| Variable   | Requis | Défaut        | Description                   |
| ---------- | ------ | ------------- | ----------------------------- |
| `NODE_ENV` | Non    | `development` | `development` \| `production` |
| `PORT`     | Non    | `3000`        | Port d'écoute du serveur      |

## Base de données

| Variable       | Requis  | Exemple                                               | Description                       |
| -------------- | ------- | ----------------------------------------------------- | --------------------------------- |
| `DATABASE_URL` | **Oui** | `mysql://root:rootpassword@localhost:3306/backend_db` | URL de connexion Prisma (MariaDB) |

## JWT & Tokens

| Variable                   | Requis  | Défaut   | Description                                            |
| -------------------------- | ------- | -------- | ------------------------------------------------------ |
| `JWT_SECRET`               | **Oui** | —        | Clé secrète de signature des JWT. Ne jamais exposer.   |
| `JWT_EXPIRES_IN`           | Non     | `900`    | Durée de vie de l'access token en secondes (15 min)    |
| `REFRESH_TOKEN_EXPIRES_IN` | Non     | `604800` | Durée du refresh token en secondes (7 jours)           |
| `EMAIL_VERIFY_EXPIRES_IN`  | Non     | `86400`  | Durée du token de vérification email en secondes (24h) |

## URLs

| Variable       | Requis  | Exemple                 | Description                                      |
| -------------- | ------- | ----------------------- | ------------------------------------------------ |
| `APP_URL`      | **Oui** | `http://localhost:3000` | URL publique de l'API (utilisée dans les emails) |
| `FRONTEND_URL` | Non     | `http://localhost:3001` | URL du front-office (CORS)                       |

## Email (SMTP)

| Variable    | Requis  | Description                                  |
| ----------- | ------- | -------------------------------------------- |
| `SMTP_HOST` | **Oui** | Hôte du serveur SMTP                         |
| `SMTP_PORT` | **Oui** | Port SMTP (ex: 587, 465)                     |
| `SMTP_USER` | **Oui** | Identifiant SMTP                             |
| `SMTP_PASS` | **Oui** | Mot de passe SMTP                            |
| `SMTP_FROM` | **Oui** | Adresse expéditeur (ex: `noreply@monapp.fr`) |

## Kaggle (ETL)

Requis uniquement pour déclencher les pipelines d'import de données.

| Variable      | Requis       | Description              |
| ------------- | ------------ | ------------------------ |
| `KAGGLE_USER` | **Pour ETL** | Nom d'utilisateur Kaggle |
| `KAGGLE_KEY`  | **Pour ETL** | Clé API Kaggle           |

## CI / CD

| Variable              | Contexte              | Description                                                                                               |
| --------------------- | --------------------- | --------------------------------------------------------------------------------------------------------- |
| `DISCORD_WEBHOOK_URL` | GitHub Actions (vars) | URL du webhook Discord pour les notifications CI. Si absent, la notification est silencieusement ignorée. |

## CSRF (complément)

| Variable      | Requis                  | Défaut       | Description                        |
| ------------- | ----------------------- | ------------ | ---------------------------------- |
| `CSRF_SECRET` | Non (prod : recommandé) | `JWT_SECRET` | Clé HMAC des tokens CSRF           |
| `CSRF_TTL_MS` | Non                     | `7200000`    | Durée de vie CSRF en millisecondes |

## Workout micro-service

| Variable                  | Requis              | Exemple                 | Description                       |
| ------------------------- | ------------------- | ----------------------- | --------------------------------- |
| `WORKOUT_SERVICE_URL`     | **Pour IA workout** | `http://localhost:8000` | URL du micro-service              |
| `WORKOUT_SERVICE_API_KEY` | **Pour IA workout** | —                       | Clé API (secret → `.env.secrets`) |

## WebSocket ETL

| Variable                 | Requis | Description                                                 |
| ------------------------ | ------ | ----------------------------------------------------------- |
| `ETL_WS_ALLOWED_ORIGINS` | Non    | Origines CORS WebSocket (virgules). Défaut : `FRONTEND_URL` |

## Docker

- **Dev / stack** : `docker-compose.yml` — réseaux `healthai-internal` et `healthai-public` ([network.md](network.md)).
- **Prod (image seule)** : `compose.yaml`.

| Variable (`.env.secrets`)                       | Usage Compose            |
| ----------------------------------------------- | ------------------------ |
| `MONGO_ROOT_USER` / `MONGO_ROOT_PASSWORD`       | MongoDB (réseau interne) |
| `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD`       | MinIO                    |
| `GRAFANA_ADMIN_USER` / `GRAFANA_ADMIN_PASSWORD` | Grafana                  |

Hardening conteneurs (non-root, limites, `no-new-privileges`, scan Trivy) : voir [README.Docker.md](../README.Docker.md).

En production / Docker, les **secrets** passent par `env_file: .env.secrets` (fichier gitignoré). Les valeurs non sensibles restent dans `environment:` du compose.

Ne jamais committer `.env` ni `.env.secrets`.

Exemple minimal pour Docker (`docker-compose.yml`) :

```yaml
env_file:
  - .env.secrets
environment:
  NODE_ENV: production
  PORT: 3001
```
