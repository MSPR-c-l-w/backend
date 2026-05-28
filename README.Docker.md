# Docker — Backend / stack HealthAI

## Secrets (#130)

Avant le premier `docker compose up` :

```bash
cp .env.example .env
cp .env.secrets.example .env.secrets
# DATABASE_URL : host `mariadb` (réseau healthai-internal), pas `localhost`
```

Les mots de passe et clés API ne doivent **pas** être dans `docker-compose.yml` — uniquement dans `.env.secrets` (gitignoré). Voir [documentation/secrets-management.md](documentation/secrets-management.md).

## Réseaux (# isolation)

| Réseau              | Services                                           | Exposition hôte |
| ------------------- | -------------------------------------------------- | --------------- |
| `healthai-internal` | MariaDB, MongoDB, MinIO API, workout-api           | Aucun port      |
| `healthai-public`   | backend, frontend, Grafana, Adminer, console MinIO | Ports minimaux  |

Schéma, firewall prod et vérifications : [documentation/network.md](documentation/network.md).

```bash
docker compose --env-file .env.secrets up -d
bash scripts/verify-docker-network.sh
curl --connect-timeout 2 localhost:3306   # → connection refused (attendu)
```

## Démarrage rapide

**Stack minimale (MariaDB + Adminer + API) :**

```bash
docker compose up -d mariadb adminer backend
```

**Stack complète :**

```bash
docker compose up -d --build
```

| Service                | URL hôte              |
| ---------------------- | --------------------- |
| API backend            | http://localhost:3000 |
| Frontend (placeholder) | http://localhost:80   |
| Grafana                | http://localhost:3001 |
| Adminer                | http://localhost:8080 |
| Console MinIO          | http://localhost:9001 |

**Image backend seule (sans stack réseau HealthAI) :**

```bash
docker compose -f compose.yaml up --build
```

## Sécurité des conteneurs (#129)

| Élément              | Backend (ce repo)                                                     |
| -------------------- | --------------------------------------------------------------------- |
| Utilisateur non-root | `appuser` / `appgroup` dans `Dockerfile`                              |
| Limites CPU/RAM      | `deploy.resources.limits` dans `compose.yaml` et `docker-compose.yml` |
| `no-new-privileges`  | Tous les services dans les compose files                              |
| Scan CVE             | Trivy dans `.github/workflows/cd.yml` (échec si critique)             |

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
