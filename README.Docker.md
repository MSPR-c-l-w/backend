# Docker — Backend

## Secrets (#130)

Avant le premier `docker compose up` :

```bash
cp .env.secrets.example .env.secrets
# Adapter DATABASE_URL pour Docker : host `mariadb` au lieu de `localhost`
```

Les mots de passe et clés API ne doivent **pas** être dans `docker-compose.yml` — uniquement dans `.env.secrets` (gitignoré). Voir [documentation/secrets-management.md](documentation/secrets-management.md).

## Démarrage rapide

**Base de données locale (MariaDB + phpMyAdmin) :**

```bash
docker compose -f docker-compose.yml up -d mariadb phpmyadmin
```

**Stack complète (DB + API) :**

```bash
docker compose -f docker-compose.yml up -d --build
```

API : http://localhost:3001 — phpMyAdmin : http://localhost:8080

**Image backend seule (prod) :**

```bash
docker compose -f compose.yaml up --build
```

## Sécurité des conteneurs (#129)

| Élément | Backend (ce repo) |
|--------|-------------------|
| Utilisateur non-root | `appuser` / `appgroup` dans `Dockerfile` |
| Limites CPU/RAM | `deploy.resources.limits` dans `compose.yaml` et `docker-compose.yml` |
| `no-new-privileges` | Tous les services dans les compose files |
| Scan CVE | Trivy dans `.github/workflows/cd.yml` (échec si critique) |

**Frontend (nginx)** — dépôt front séparé ; à y appliquer :

- `cap_drop: [ALL]` + `cap_add: [NET_BIND_SERVICE]`
- `read_only: true` + `tmpfs: [/tmp, /var/run/nginx]`
- Limites : `0.2` CPU / `128M` RAM

## Build multi-plateforme

```bash
docker build --platform=linux/amd64 -t backend:local .
```

## Scan manuel des vulnérabilités

```bash
docker build -t backend:scan .
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image --severity CRITICAL backend:scan
```
