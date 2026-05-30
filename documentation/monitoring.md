# Système de supervision — HealthAI Coach

## Table des matières

1. [Architecture](#1-architecture)
2. [Stack de monitoring](#2-stack-de-monitoring)
3. [Métriques disponibles](#3-métriques-disponibles)
4. [Dashboards Grafana](#4-dashboards-grafana)
5. [Alertes Prometheus](#5-alertes-prometheus)
6. [Centralisation des logs (Loki)](#6-centralisation-des-logs-loki)
7. [Guide de démarrage](#7-guide-de-démarrage)
8. [Guide développeur — ajouter une métrique](#8-guide-développeur--ajouter-une-métrique)
9. [Runbooks opérationnels](#9-runbooks-opérationnels)
10. [Limitations macOS / Rancher Desktop](#10-limitations-macos--rancher-desktop)

---

## 1. Architecture

La stack de supervision suit le modèle **Prometheus + Grafana + Loki** (standard industrie CNCF).

```
Sources de métriques
  NestJS :3001/metrics  →  http_requests, etl_pipeline, ai_api_calls, nodejs_*
  FastAPI :8000/metrics →  métriques IA (si déployé)
  Node Exporter :9100   →  CPU, RAM, disque, réseau hôte
  Docker Daemon :9323   →  conteneurs running/stopped, événements Docker
         │
         │ scrape 15s
         ▼
     Prometheus :9090   —  stockage TSDB, évaluation alertes
         │
         ▼
     AlertManager :9093 —  déduplication, silences, routage webhook

Logs Docker (stdout/stderr)
  Docker socket → Promtail → Loki :3100
                                  │
                                  ▼
                          Grafana :3002  ←  Prometheus + Loki
```

---

## 2. Stack de monitoring

### Services

| Service          | Image                         | Port  | Rôle                                    |
|------------------|-------------------------------|-------|-----------------------------------------|
| **Prometheus**   | `prom/prometheus:v2.51.2`     | 9090  | Collecte et stockage métriques          |
| **Grafana**      | `grafana/grafana:10.4.3`      | 3002  | Visualisation — dashboards              |
| **AlertManager** | `prom/alertmanager:v0.27.0`   | 9093  | Routage et gestion des alertes          |
| **Loki**         | `grafana/loki:3.0.0`          | 3100  | Stockage et indexation des logs         |
| **Promtail**     | `grafana/promtail:3.0.0`      | 9080  | Collecte logs Docker → Loki             |
| **Node Exporter**| `prom/node-exporter:v1.8.1`   | 9100  | Métriques système hôte                  |

### Targets Prometheus

| Job               | Target                          | Ce qui est collecté               |
|-------------------|---------------------------------|-----------------------------------|
| `backend-nestjs`  | `host.docker.internal:3001`     | HTTP, ETL, IA, Node.js runtime    |
| `api-ia-fastapi`  | `host.docker.internal:8000`     | FastAPI IA (si disponible)        |
| `node-exporter`   | `node-exporter:9100`            | CPU, RAM, disque, réseau          |
| `docker-daemon`   | `host.docker.internal:9323`     | Conteneurs, événements Docker     |

### Commandes

```bash
# Depuis le dossier docker/
docker compose -f docker-compose.monitoring.yml up -d        # démarrer
docker compose -f docker-compose.monitoring.yml down         # arrêter
docker compose -f docker-compose.monitoring.yml ps           # statut
docker compose -f docker-compose.monitoring.yml restart <svc> # relancer un service
```

---

## 3. Métriques disponibles

### 3.1 Métriques custom NestJS

Déclarées dans `src/metrics/metrics.module.ts`, exposées via `src/metrics/metrics.service.ts`.

| Métrique                           | Type      | Labels                           | Description                        |
|------------------------------------|-----------|----------------------------------|------------------------------------|
| `http_requests_total`              | Counter   | `route`, `method`, `status_code` | Toutes les requêtes HTTP reçues    |
| `http_request_duration_seconds`    | Histogram | `route`, `method`                | Latence par route (buckets 10ms–30s)|
| `etl_pipeline_duration_seconds`    | Histogram | `pipeline`                       | Durée ETL : nutrition, exercise, health-profile |
| `ai_api_calls_total`               | Counter   | `provider`, `type`               | Appels vers les APIs IA            |

### 3.2 Métriques Node.js (collectées automatiquement)

| Métrique                           | Seuil alerte | Description                          |
|------------------------------------|--------------|--------------------------------------|
| `nodejs_eventloop_lag_p99_seconds` | > 500ms      | Lag p99 de l'event loop              |
| `nodejs_heap_size_used_bytes`      | > 85% total  | Heap V8 utilisé                      |
| `nodejs_heap_size_total_bytes`     | —            | Heap V8 total alloué                 |
| `nodejs_gc_duration_seconds`       | —            | Durée GC par type (major/minor)      |
| `nodejs_active_handles_total`      | —            | Connexions et timers libuv actifs    |
| `process_cpu_seconds_total`        | —            | CPU consommé par NestJS              |
| `process_resident_memory_bytes`    | —            | Mémoire RSS du process               |

### 3.3 Métriques système (Node Exporter)

| Métrique                                       | Description               |
|------------------------------------------------|---------------------------|
| `node_cpu_seconds_total{mode="idle"}`          | CPU disponible            |
| `node_memory_MemAvailable_bytes`               | RAM disponible            |
| `node_memory_MemTotal_bytes`                   | RAM totale                |
| `node_filesystem_avail_bytes{mountpoint="/"}`  | Espace disque disponible  |
| `node_network_receive_bytes_total`             | Trafic réseau entrant     |

### 3.4 Métriques Docker Daemon

| Métrique                                       | Description                    |
|------------------------------------------------|--------------------------------|
| `engine_daemon_container_states_containers`    | Conteneurs par état (running/stopped/paused) |
| `engine_daemon_events_total`                   | Événements Docker (start/stop/die) |
| `engine_daemon_engine_memory_bytes`            | RAM disponible pour Docker     |

---

## 4. Dashboards Grafana

**Accès :** http://localhost:3002 — identifiants : `admin` / `admin`

Les dashboards sont auto-provisionnés depuis `docker/grafana/dashboards/`. Tout fichier JSON ajouté dans ce dossier est chargé automatiquement (délai max 30s).

### 4.1 Stack Overview (`stack-overview`)

Vue d'ensemble de l'infrastructure.

| Panel                       | Métrique                                              |
|-----------------------------|-------------------------------------------------------|
| Services actifs             | `count(up == 1)`                                      |
| Conteneurs Docker running   | `engine_daemon_container_states_containers{state="running"}` |
| CPU host % (gauge)          | `100 - avg(rate(node_cpu_seconds_total{mode="idle"}[2m])) * 100` |
| RAM utilisée % (gauge)      | `(MemTotal - MemAvailable) / MemTotal * 100`          |
| CPU global (timeseries)     | Historique charge CPU hôte                            |
| RAM utilisée / totale       | Évolution mémoire hôte                               |
| Conteneurs par état         | `engine_daemon_container_states_containers`           |
| Événements Docker           | `rate(engine_daemon_events_total[2m])`                |
| Uptime services (table)     | `up` — état de chaque target                          |

### 4.2 API NestJS (`api-nestjs`) — Refresh 15s

Santé et performances de l'API NestJS. Dashboard principal pour le suivi en production.

**Rangée 1 — Indicateurs de santé :**

| Panel                  | Seuils                              |
|------------------------|-------------------------------------|
| Requêtes/s             | jaune > 10, rouge > 50              |
| Erreurs 4xx %          | jaune > 5%, rouge > 10%             |
| Erreurs 5xx %          | rouge dès 1%                        |
| Event Loop Lag p99     | jaune > 100ms, rouge > 500ms        |
| Heap utilisé %         | jaune > 70%, rouge > 85%            |
| CPU process %          | jaune > 50%, rouge > 80%            |

**Rangées 2–3 — Performances :**
- Latence p50/p95/p99 toutes routes
- Tendance Event Loop (p50/p90/p99)
- Requêtes/s par endpoint (identifier les routes chaudes)
- Mémoire Heap used/total/RSS

**Rangées 4–5 — Runtime Node.js :**
- Garbage Collector (durée par type major/minor)
- Handles libuv actifs (connexions ouvertes)

**Rangée finale — Logs :**
- Stream logs ERROR NestJS en temps réel (Loki)

### 4.3 ETL Pipelines (`etl-pipelines`) — Période par défaut 24h

Dashboard dédié aux 3 pipelines ETL du projet.

**Rangée 1 — Synthèse par pipeline :**

| Stat             | Nutrition     | Exercise       | Health Profile |
|------------------|---------------|----------------|----------------|
| Nombre de runs   | compteur      | compteur       | compteur       |
| Durée moy        | jaune > 30s / rouge > 60s | jaune > 60s / rouge > 120s | jaune > 10s / rouge > 30s |

**Rangée 2 — Historique :**
- Durée p50/p95 par pipeline (timeseries)

**Rangée 3 — Comparaison :**
- Bargauge total exécutions par pipeline
- Bargauge durée cumulée par pipeline

**Logs ETL :** filtré sur `pipeline|ETL|import` (Loki)

### 4.4 AI Services (`ai-services`)

Suivi des appels aux APIs IA externes.

| Panel                    | Description                                     |
|--------------------------|-------------------------------------------------|
| Total appels IA cumulé   | Compteur depuis le démarrage                    |
| API IA disponible        | UP/DOWN du service FastAPI                      |
| Appels/min               | Cadence actuelle                                |
| Appels/min par provider  | Ventilation provider × type (timeseries)        |
| Répartition par provider | Camembert des appels                            |
| Logs IA                  | Logs filtrés workout/generateProgram (Loki)     |

---

## 5. Alertes Prometheus

Fichier de règles : `docker/prometheus/alerts.yml`

### Groupe : SLA Service

| Alerte              | Expression                              | Délai | Sévérité | Impact                             |
|---------------------|-----------------------------------------|-------|----------|------------------------------------|
| `ServiceDown`       | `up == 0`                               | 1m    | critical | Service inaccessible               |
| `HighErrorRate5xx`  | taux 5xx > 5%                           | 1m    | critical | Erreurs serveur en rafale          |
| `HighLatency`       | p95 latence > 2s                        | 2m    | warning  | Dégradation UX                     |

### Groupe : Node.js Runtime

| Alerte              | Expression                              | Délai | Sévérité | Impact                             |
|---------------------|-----------------------------------------|-------|----------|------------------------------------|
| `HighEventLoopLag`  | event loop p99 > 500ms                  | 2m    | warning  | Requêtes ralenties, timeouts       |
| `HighHeapUsage`     | heap > 85%                              | 5m    | warning  | Risque d'OOM crash                 |

### Groupe : Infrastructure

| Alerte              | Expression                              | Délai | Sévérité | Impact                             |
|---------------------|-----------------------------------------|-------|----------|------------------------------------|
| `HighCpuUsage`      | CPU hôte > 80%                          | 2m    | warning  | Ralentissement général             |
| `HighMemoryUsage`   | RAM > 85%                               | 5m    | warning  | Swap, OOM potentiel                |
| `DiskSpaceLow`      | espace disque `/` < 15%                 | 0m    | critical | Logs non écrits, DB corrompue      |

### Groupe : ETL

| Alerte                | Expression                              | Délai | Sévérité | Impact                         |
|-----------------------|-----------------------------------------|-------|----------|--------------------------------|
| `ETLPipelineNotRun`   | pas de run depuis 24h                   | 0m    | info     | Données obsolètes potentielles |

### Interface

```bash
open http://localhost:9093    # AlertManager UI — alertes actives, silences
open http://localhost:9090    # Prometheus UI — requêtes ad hoc, règles, targets
```

---

## 6. Centralisation des logs (Loki)

### Pipeline de collecte

```
Conteneur Docker (stdout/stderr)
  ↓ Docker socket
Promtail
  ↓ labels enrichis
Loki :3100
  ↓ requêtes LogQL
Grafana (datasource Loki)
```

### Labels appliqués par Promtail

| Label       | Exemple          | Source                              |
|-------------|------------------|-------------------------------------|
| `container` | `backend-nestjs` | Nom du conteneur Docker             |
| `service`   | `grafana`        | Label docker-compose service        |
| `level`     | `ERROR`, `WARN`  | Extrait des logs NestJS / FastAPI   |
| `component` | `backend`, `ai`  | Calculé depuis le nom du conteneur  |

> **Filtre bruit :** les requêtes `GET /health` et `GET /metrics` sont exclues de Loki automatiquement.

### Requêtes LogQL utiles

```logql
# Erreurs NestJS
{container="backend-nestjs"} |= "ERROR"

# Logs ETL / imports
{container="backend-nestjs"} |~ "pipeline|ETL|import|Import"

# Tous les WARN et ERROR
{level=~"ERROR|WARN"}

# Logs d'une route spécifique
{container="backend-nestjs"} |~ "POST /nutrition|POST /exercise"

# Fréquence d'erreurs (pour alertes Grafana)
sum(rate({container="backend-nestjs", level="ERROR"}[1m]))
```

---

## 7. Guide de démarrage

### Prérequis

- Rancher Desktop en cours d'exécution
- MariaDB démarrée : `docker compose up -d` (à la racine du projet)
- Environnement NestJS : `.env` configuré, `npm install` effectué

### Démarrage complet

```bash
# 1. Stack monitoring (depuis le dossier docker/)
cd docker/
docker compose -f docker-compose.monitoring.yml up -d

# 2. Backend NestJS (depuis la racine)
cd ..
npm run build
npm run start:prod

# 3. Vérification des targets Prometheus
curl -s http://localhost:9090/api/v1/targets | python3 -c "
import json, sys
for t in json.load(sys.stdin)['data']['activeTargets']:
    emoji = '✅' if t['health'] == 'up' else '❌'
    print(emoji, t['labels']['job'], '-', t['health'])
"

# 4. Accès Grafana
open http://localhost:3002   # admin / admin
```

### Générer des métriques ETL

```bash
# Authentification
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"agathe.andre@example.com","password":"SeedPassword123!"}' \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['access_token'])")

# Lancer les 3 pipelines
curl -X POST http://localhost:3001/nutrition/import      -H "Authorization: Bearer $TOKEN"
curl -X POST http://localhost:3001/exercise/import       -H "Authorization: Bearer $TOKEN"
curl -X POST http://localhost:3001/health-profile/import -H "Authorization: Bearer $TOKEN"
```

---

## 8. Guide développeur — ajouter une métrique

### Étape 1 — Déclarer dans MetricsModule

```typescript
// src/metrics/metrics.module.ts
import { makeCounterProvider, makeHistogramProvider } from '@willsoto/nestjs-prometheus';

providers: [
  MetricsService,
  makeCounterProvider({
    name: 'ma_metrique_total',
    help: 'Description courte de la métrique',
    labelNames: ['label1', 'label2'],
  }),
]
```

### Étape 2 — Exposer dans MetricsService

```typescript
// src/metrics/metrics.service.ts
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter } from 'prom-client';

constructor(
  @InjectMetric('ma_metrique_total')
  private readonly maMetrique: Counter<string>,
) {}

incrementer(label1: string, label2: string): void {
  this.maMetrique.inc({ label1, label2 });
}
```

### Étape 3 — Importer MetricsModule dans le module cible

```typescript
// src/mon-module/mon-module.module.ts
@Module({
  imports: [MetricsModule],
  providers: [MonService],
})
```

### Étape 4 — Injecter dans le service

```typescript
constructor(private readonly metricsService: MetricsService) {}

async maMethode(): Promise<void> {
  this.metricsService.incrementer('valeur1', 'valeur2');
}
```

### Étape 5 — Vérifier

```bash
curl http://localhost:3001/metrics | grep ma_metrique
```

---

## 9. Runbooks opérationnels

### RB-01 — Service DOWN (`ServiceDown`)

```bash
# 1. Identifier le service
curl -s http://localhost:9090/api/v1/alerts | python3 -c "
import json,sys
for a in json.load(sys.stdin)['data']['alerts']:
    if a['state'] == 'firing':
        print(a['labels']['alertname'], '→', a['labels'].get('job',''))
"

# 2. Logs du service
docker logs <nom-conteneur> --tail 50

# 3. Redémarrer
docker compose -f docker/docker-compose.monitoring.yml restart <service>
```

### RB-02 — Latence élevée (`HighLatency`)

```bash
# Vérifier l'event loop
curl -s "http://localhost:9090/api/v1/query?query=nodejs_eventloop_lag_p99_seconds" \
  | python3 -c "import json,sys; r=json.load(sys.stdin)['data']['result']; print(float(r[0]['value'][1])*1000, 'ms p99')"

# Vérifier si un pipeline ETL est en cours (bloque la DB)
curl -s "http://localhost:9090/api/v1/query?query=etl_pipeline_duration_seconds_count" \
  | python3 -c "import json,sys; [print(r['metric']['pipeline'], r['value'][1]) for r in json.load(sys.stdin)['data']['result']]"

# Logs récents
docker logs backend-nestjs --since 5m | grep -E "ERROR|WARN"
```

### RB-03 — Event Loop bloquée (`HighEventLoopLag`)

Causes probables : opération synchrone bloquante (JSON.parse massif, crypto), boucle CPU-bound, fuites de connexions.

```bash
# Handles actifs
curl -s "http://localhost:9090/api/v1/query?query=nodejs_active_handles_total" \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['result'][0]['value'][1], 'handles')"

# Logs avec contexte
docker logs backend-nestjs --since 10m | grep -B2 -A2 "ERROR"
```

### RB-04 — Heap saturée (`HighHeapUsage`)

```bash
# Utilisation actuelle
curl -s "http://localhost:9090/api/v1/query?query=nodejs_heap_size_used_bytes/nodejs_heap_size_total_bytes*100" \
  | python3 -c "import json,sys; print(round(float(json.load(sys.stdin)['data']['result'][0]['value'][1]),1), '%')"

# Si > 90% : redémarrer NestJS (récupérer PID via ps aux | grep 'node dist/main')
```

### RB-05 — Disque critique (`DiskSpaceLow`)

```bash
df -h /
docker system prune --volumes -f   # purger images/volumes non utilisés
```

### RB-06 — Pipeline ETL anormalement lent

```bash
# Durées moyennes actuelles
curl -s "http://localhost:9090/api/v1/query?query=etl_pipeline_duration_seconds_sum/etl_pipeline_duration_seconds_count" \
  | python3 -c "
import json,sys
for r in json.load(sys.stdin)['data']['result']:
    print(f'{r[\'metric\']["pipeline"]}: {float(r[\'value\'][1]):.1f}s')
"

# Logs pipeline
docker logs backend-nestjs --tail 200 | grep -i "pipeline\|ETL\|import\|ERROR"
```

---

## 10. Limitations macOS / Rancher Desktop

### Pourquoi cAdvisor ne fonctionne pas

Sur macOS, Docker tourne dans une VM Linux (Lima/k3s). cAdvisor s'exécute dans cette VM et voit les processus Linux internes (openrc, k3s, traefik…) mais **pas les conteneurs Docker nommés du projet**.

Toutes les images cAdvisor ont ce comportement sur macOS (gcr.io, ghcr.io, zcube) — c'est architectural.

**Alternative retenue :** Docker Daemon Metrics sur port `9323`, qui fournit :
- `engine_daemon_container_states_containers` → running/stopped/paused
- `engine_daemon_events_total` → événements start/stop/die
- `engine_daemon_engine_memory_bytes` → RAM dispo Docker

### Restaurer les métriques Docker Daemon

Si `engine_daemon_*` disparaissent après redémarrage de Rancher Desktop :

```bash
# Réécrire daemon.json dans la VM Lima
docker run --rm --privileged --pid=host alpine:latest \
  nsenter -t 1 -m -u -n -i -- sh -c \
  'echo "{"features":{"containerd-snapshotter":true},"metrics-addr":"0.0.0.0:9323","experimental":true}" > /etc/docker/daemon.json'

# Puis redémarrer Rancher Desktop
```

### Migration vers un serveur Linux (production)

Sur Linux, cAdvisor fonctionne nativement et expose des métriques par conteneur (`name` label).

**Changements à effectuer :**

Dans `docker/docker-compose.monitoring.yml`, remplacer le service `(aucun)` par :
```yaml
cadvisor:
  image: gcr.io/cadvisor/cadvisor:latest
  volumes:
    - /:/rootfs:ro
    - /var/run:/var/run:ro
    - /sys:/sys:ro
    - /var/lib/docker:/var/lib/docker:ro
  ports:
    - '8081:8080'
```

Dans `docker/prometheus/prometheus.yml`, remplacer `docker-daemon` par :
```yaml
- job_name: cadvisor
  static_configs:
    - targets: ['cadvisor:8080']
```

Dans `docker/grafana/dashboards/stack-overview.json`, utiliser :
```promql
rate(container_cpu_usage_seconds_total{name!=""}[2m]) * 100
container_memory_usage_bytes{name!=""}
```
