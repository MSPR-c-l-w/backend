# Architecture réseau Docker — HealthAI

Isolation des services : données et API internes sur `healthai-internal`, exposition minimale sur `healthai-public`.

Fichier Compose : [`docker-compose.yml`](../docker-compose.yml) (projet `name: healthai`).

## Schéma

```mermaid
flowchart TB
  subgraph host["Hôte Linux"]
    subgraph pub["healthai-public (bridge)"]
      FE["frontend :80"]
      BE["backend :3000"]
      GF["Grafana :3001→3000"]
      AD["Adminer :8080"]
      MC["MinIO console :9001"]
    end
    subgraph internal["healthai-internal (bridge)"]
      DB[(MariaDB)]
      MG[(MongoDB)]
      IA["workout-api FastAPI :8000"]
      S3["MinIO API :9000"]
    end
  end

  BE --> DB
  BE --> IA
  IA --> MG
  AD --> DB
  MC -.-> S3
  FE -.-> BE

  client["Client navigateur"] --> FE
  client --> BE
  client --> GF
  client --> AD
  client --> MC
```

## Réseaux

| Réseau              | Driver   | Rôle                                                                                     |
| ------------------- | -------- | ---------------------------------------------------------------------------------------- |
| `healthai-internal` | `bridge` | MariaDB, MongoDB, MinIO (API S3), micro-service FastAPI — **aucun** `ports:` vers l'hôte |
| `healthai-public`   | `bridge` | Services accessibles depuis l'hôte avec mapping minimal                                  |

### Services internes (`healthai-internal` uniquement)

| Service        | Conteneur              | Port conteneur  | Port hôte |
| -------------- | ---------------------- | --------------- | --------- |
| MariaDB        | `healthai-mariadb`     | 3306            | —         |
| MongoDB        | `healthai-mongodb`     | 27017           | —         |
| workout-api    | `healthai-workout-api` | 8000            | —         |
| MinIO (API S3) | `healthai-minio`       | 9000 (`expose`) | —         |

### Services publics (`healthai-public`)

| Service       | Mapping hôte | Remarque                                              |
| ------------- | ------------ | ----------------------------------------------------- |
| backend       | `3000:3000`  | NestJS — joint aussi `healthai-internal` pour MariaDB |
| frontend      | `80:80`      | nginx placeholder (repo front séparé en prod)         |
| Grafana       | `3001:3000`  | UI monitoring                                         |
| Adminer       | `8080:8080`  | Accès SQL via réseau interne vers MariaDB             |
| MinIO console | `9001:9001`  | Console web ; API S3 reste interne                    |

## Démarrage

```bash
cp .env.example .env
cp .env.secrets.example .env.secrets
# DATABASE_URL : host `mariadb` (pas localhost)
#   mysql://backend_user:...@mariadb:3306/backend_db

docker compose --env-file .env.secrets up -d
```

`--env-file` permet la substitution des variables dans `docker-compose.yml` (mot de passe MongoDB, MinIO, etc.).

Stack minimale (sans IA / observabilité) :

```bash
docker compose up -d mariadb adminer backend
```

## Vérifications d'acceptance

```bash
# Réseaux et isolation
bash scripts/verify-docker-network.sh

# Inspection manuelle
docker network inspect healthai-internal

# MariaDB non joignable depuis l'hôte
curl -v --connect-timeout 2 localhost:3306
# → Connection refused (attendu)

# Depuis un conteneur sur le réseau interne (OK)
docker compose exec backend sh -c 'nc -zv mariadb 3306'
```

## Firewall production (Linux)

Règles à appliquer sur le **serveur hôte** en plus de l'isolation Docker. Adapter les IP admin (`ADMIN_IP`) et l'interface publique.

### UFW (Ubuntu / Debian)

```bash
# Politique par défaut
sudo ufw default deny incoming
sudo ufw default allow outgoing

# SSH administrateur (obligatoire avant enable)
sudo ufw allow from ADMIN_IP to any port 22 proto tcp comment 'SSH admin'

# Exposition publique HealthAI (réseau healthai-public)
sudo ufw allow 80/tcp comment 'frontend HTTP'
sudo ufw allow 3000/tcp comment 'backend API'
sudo ufw allow 3001/tcp comment 'Grafana'
sudo ufw allow 8080/tcp comment 'Adminer'
sudo ufw allow 9001/tcp comment 'MinIO console'

# Interdire explicitement les ports BDD / S3 API sur l'hôte
sudo ufw deny 3306/tcp comment 'MariaDB non exposée'
sudo ufw deny 27017/tcp comment 'MongoDB non exposée'
sudo ufw deny 9000/tcp comment 'MinIO S3 API non exposée'

sudo ufw enable
sudo ufw status verbose
```

Restreindre Adminer, Grafana et MinIO console au VPN / IP admin :

```bash
sudo ufw delete allow 8080/tcp
sudo ufw allow from ADMIN_IP to any port 8080 proto tcp comment 'Adminer admin only'
```

### iptables (générique)

```bash
# Exemple : n'autoriser que HTTP/HTTPS et backend depuis Internet
iptables -A INPUT -i lo -j ACCEPT
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
iptables -A INPUT -p tcp --dport 22 -s ADMIN_IP -j ACCEPT
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
iptables -A INPUT -p tcp --dport 3306 -j DROP
iptables -A INPUT -p tcp --dport 27017 -j DROP
iptables -A INPUT -p tcp --dport 9000 -j DROP
iptables -A INPUT -j DROP
```

Persistance : `iptables-save` / `netfilter-persistent` selon la distribution.

## Bonnes pratiques

- Ne pas ajouter de `ports:` sur MariaDB, MongoDB ni l'API MinIO (`9000`).
- Adminer et Grafana : restreindre en production (VPN, IP allowlist, ou profil Compose `tools` désactivé).
- Le backend résout les hôtes par **nom de service Docker** (`mariadb`, `workout-api`, `minio`).
- Voir aussi [secrets-management.md](secrets-management.md) et [README.Docker.md](../README.Docker.md).

## Références

- [environment.md](environment.md) — variables `DATABASE_URL`, `WORKOUT_SERVICE_URL`, MinIO, MongoDB
- [security.md](security.md) — durcissement conteneurs
