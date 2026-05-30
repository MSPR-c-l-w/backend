# Système de supervision — HealthAI Coach

## Table des matières

1. [Introduction et architecture](#1-introduction-et-architecture)
2. [Métriques collectées](#2-métriques-collectées)
3. [Guide de démarrage rapide](#3-guide-de-démarrage-rapide)
4. [Runbook — Latence API élevée](#4-runbook--latence-api-élevée)
5. [Runbook — Service down](#5-runbook--service-down)
6. [Runbook — Disque saturé](#6-runbook--disque-saturé)
7. [Ajouter une nouvelle métrique custom NestJS](#7-ajouter-une-nouvelle-métrique-custom-nestjs)
8. [Ajouter un nouveau dashboard Grafana](#8-ajouter-un-nouveau-dashboard-grafana)
9. [Migration ELK → Loki](#9-migration-elk--loki)
10. [Configuration des ports](#10-configuration-des-ports)

---

## 1. Introduction et architecture

### Présentation

Le système de supervision de HealthAI Coach offre une observabilité complète de la stack applicative : métriques temps réel, agrégation de logs, alertes proactives et dashboards Grafana préconfigurés.

### Architecture globale

```
┌─────────────────────────────────────────────────────────┐
│                    Sources de données                    │
│  NestJS (:3000/metrics)   FastAPI (:8000/metrics)        │
│  Node Exporter (:9100)    cAdvisor (:8081)               │
└────────────────────┬────────────────────────────────────┘
                     │ scrape (15s)
                     ▼
             ┌───────────────┐
             │  Prometheus   │ (:9090)  — stockage métriques
             └───────┬───────┘
                     │ évaluation règles
                     ▼
             ┌───────────────┐
             │ AlertManager  │ (:9093)  — routage alertes
             └───────┬───────┘
                     │ webhook
                     ▼
             ┌───────────────┐
             │ Backend NestJS│ (:3000/alerts/webhook)
             └───────────────┘

┌─────────────────────────────────────────────────────────┐
│                    Agrégation de logs                    │
│  Promtail (scrape Docker)  ──►  Loki (:3100)            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    Visualisation                         │
│  Grafana (:3001) ◄── Prometheus + Loki                  │
└─────────────────────────────────────────────────────────┘
```

### Composants

| Composant      | Version  | Rôle                                               |
|----------------|----------|----------------------------------------------------|
| Prometheus     | v2.51.2  | Collecte et stockage des métriques (scrape pull)   |
| AlertManager   | v0.27.0  | Routage, groupement et envoi des alertes           |
| Node Exporter  | v1.8.1   | Métriques système hôte (CPU, RAM, disque, réseau)  |
| cAdvisor       | v0.49.1  | Métriques par conteneur Docker                     |
| Loki           | v3.0.0   | Agrégation et indexation des logs                  |
| Promtail       | v3.0.0   | Collecteur de logs Docker → Loki                   |
| Grafana        | v10.4.3  | Dashboards, alertes visuelles, exploration logs    |

---

## 2. Métriques collectées

### 2.1 Métriques applicatives NestJS (exposées sur `/metrics`)

| Nom de la métrique                   | Type      | Labels                            | Description                                    | Seuil d'alerte               |
|--------------------------------------|-----------|-----------------------------------|------------------------------------------------|------------------------------|
| `http_requests_total`                | Counter   | `route`, `method`, `status_code`  | Nombre total de requêtes HTTP reçues           | Taux 5xx > 5 % sur 1 min     |
| `http_request_duration_seconds`      | Histogram | `route`, `method`, `status_code`  | Durée des requêtes HTTP (buckets : 50ms–1s)    | p95 > 1 s sur 5 min          |
| `ai_api_calls_total`                 | Counter   | `provider`, `type`                | Nombre d'appels aux APIs IA externes           | —                            |
| `etl_pipeline_duration_seconds`      | Histogram | `pipeline`                        | Durée des pipelines ETL (buckets : 1s–300s)    | p95 > 120 s sur 5 min        |
| `nodejs_*` (default metrics)         | Gauge/Counter | —                             | Métriques Node.js intégrées (heap, GC, etc.)   | —                            |
| `process_*` (default metrics)        | Gauge     | —                                 | Métriques processus (CPU, mémoire, FDs)        | —                            |

### 2.2 Métriques infrastructure (Node Exporter)

| Nom de la métrique                            | Type    | Description                             | Seuil d'alerte          |
|-----------------------------------------------|---------|-----------------------------------------|-------------------------|
| `node_cpu_seconds_total`                      | Counter | Temps CPU par mode (user, system, idle) | > 80 % sur 5 min        |
| `node_memory_MemAvailable_bytes`              | Gauge   | Mémoire disponible                      | < 10 % de MemTotal      |
| `node_filesystem_avail_bytes`                 | Gauge   | Espace disque disponible par partition  | < 15 % disponible       |
| `node_network_receive_bytes_total`            | Counter | Octets reçus par interface réseau       | —                       |
| `node_network_transmit_bytes_total`           | Counter | Octets émis par interface réseau        | —                       |

### 2.3 Métriques conteneurs (cAdvisor)

| Nom de la métrique                              | Type    | Labels           | Description                        | Seuil d'alerte     |
|-------------------------------------------------|---------|------------------|------------------------------------|--------------------|
| `container_cpu_usage_seconds_total`             | Counter | `name`, `image`  | CPU cumulé par conteneur           | > 80 % sur 2 min   |
| `container_memory_usage_bytes`                  | Gauge   | `name`, `image`  | Mémoire utilisée par conteneur     | —                  |
| `container_network_receive_bytes_total`         | Counter | `name`           | Trafic réseau entrant              | —                  |
| `container_network_transmit_bytes_total`        | Counter | `name`           | Trafic réseau sortant              | —                  |

### 2.4 Métriques base de données (MariaDB Exporter — optionnel)

| Nom de la métrique                              | Type  | Description                             | Seuil d'alerte              |
|-------------------------------------------------|-------|-----------------------------------------|-----------------------------|
| `mysql_global_status_threads_connected`         | Gauge | Connexions actives                      | > 80 % de max_connections   |
| `mysql_global_variables_max_connections`        | Gauge | Limite maximale de connexions           | —                           |
| `mysql_global_status_slow_queries`              | Counter | Requêtes lentes cumulées              | Augmentation > 10/min       |

---

## 3. Guide de démarrage rapide

### Prérequis

- Docker et Docker Compose installés
- Le backend NestJS démarré sur le port `3000`
- Le répertoire `docker/` présent à la racine du projet

### Démarrer la stack de monitoring

```bash
# Depuis la racine du projet backend
cd docker

# Démarrer tous les services de monitoring en arrière-plan
docker compose -f docker-compose.monitoring.yml up -d

# Vérifier que tous les services sont actifs
docker compose -f docker-compose.monitoring.yml ps
```

### Accès aux interfaces

```bash
# Grafana (dashboards)
open http://localhost:3001
# Identifiants par défaut : admin / admin

# Prometheus (requêtes PromQL, cibles de scrape)
open http://localhost:9090

# AlertManager (alertes en cours, silences)
open http://localhost:9093

# cAdvisor (métriques conteneurs en temps réel)
open http://localhost:8081

# Métriques brutes NestJS
curl http://localhost:3000/metrics
```

### Arrêter la stack

```bash
cd docker
docker compose -f docker-compose.monitoring.yml down

# Suppression également des volumes (perte des données historiques)
docker compose -f docker-compose.monitoring.yml down -v
```

### Vérifier la santé du scraping Prometheus

```bash
# Vérifier que les cibles sont bien scrapées (state = "up")
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health: .health}'
```

---

## 4. Runbook — Latence API élevée

**Alerte déclenchée :** p95 de `http_request_duration_seconds` > 1 s sur 5 minutes.

### Étape 1 — Identifier les endpoints impactés

Dans Grafana → dashboard **API NestJS** → panneau **Requêtes/s par endpoint**, filtrer sur les routes avec latence élevée.

Ou en PromQL :
```promql
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route))
```

### Étape 2 — Vérifier la charge système

```bash
# CPU et mémoire des conteneurs
docker stats --no-stream

# Vérifier les connexions base de données
docker exec -it <container_mariadb> mysql -u root -p -e "SHOW STATUS LIKE 'Threads_connected';"
```

### Étape 3 — Analyser les logs

Dans Grafana → Explore → datasource **Loki** :
```logql
{service="backend-nestjs"} |= "ERROR" | json | latency > 1000
```

### Étape 4 — Actions correctives

| Cause probable            | Action                                                       |
|---------------------------|--------------------------------------------------------------|
| Requête DB lente          | Analyser les slow queries, ajouter un index                  |
| Pool de connexions saturé | Augmenter `connection_limit` dans `DATABASE_URL`             |
| Endpoint non optimisé     | Profiler le service NestJS concerné, ajouter du cache        |
| Pic de trafic soudain     | Scaler horizontalement le backend ou limiter le rate         |

### Étape 5 — Validation

Vérifier que le p95 repasse sous 500 ms dans Grafana sur une fenêtre de 5 minutes.

---

## 5. Runbook — Service down

**Alerte déclenchée :** `up == 0` pendant plus d'1 minute pour un job Prometheus.

### Étape 1 — Identifier le service impacté

```bash
# Vérifier l'état des cibles Prometheus
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | select(.health != "up") | {job: .labels.job, instance: .labels.instance, lastError: .lastError}'
```

### Étape 2 — Vérifier l'état du conteneur

```bash
# Lister les conteneurs arrêtés
docker ps -a --filter "status=exited"

# Voir les logs du conteneur impacté
docker logs <container_name> --tail 100
```

### Étape 3 — Redémarrer le service

```bash
# Redémarrer un service spécifique
docker compose -f docker/docker-compose.monitoring.yml restart <service_name>

# Ou pour le backend NestJS (hors stack monitoring)
docker compose restart backend
```

### Étape 4 — Vérifier la reprise

```bash
# Attendre ~30 secondes puis vérifier que l'alerte se résout
curl -s http://localhost:9090/api/v1/query?query=up | jq '.data.result[] | select(.metric.job == "<job_name>") | .value[1]'
```

### Étape 5 — Post-mortem

Si le service redémarre en boucle (crash loop) :
1. Analyser les logs avec `docker logs <container> --tail 200`
2. Vérifier les variables d'environnement requises
3. Vérifier la connectivité réseau interne Docker
4. Escalader si non résolu en < 15 minutes

---

## 6. Runbook — Disque saturé

**Alerte déclenchée :** espace disponible sur une partition < 15 % (via Node Exporter).

### Étape 1 — Identifier la partition impactée

```bash
df -h
# ou en PromQL
# node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"} * 100
```

### Étape 2 — Identifier les gros consommateurs

```bash
# Top 10 des dossiers les plus lourds
du -sh /* 2>/dev/null | sort -rh | head -10

# Volumes Docker
docker system df
docker volume ls
```

### Étape 3 — Libérer de l'espace

```bash
# Nettoyer les images, conteneurs et volumes Docker inutilisés
docker system prune -f

# Supprimer les images non utilisées
docker image prune -a -f

# Compresser ou archiver les logs anciens
find /var/log -name "*.log" -mtime +7 -exec gzip {} \;
```

### Étape 4 — Purger les données Prometheus anciennes (si nécessaire)

```bash
# Via l'API Admin Prometheus (activer --web.enable-admin-api)
curl -X POST "http://localhost:9090/api/v1/admin/tsdb/delete_series?match[]={job='old-job'}"
curl -X POST http://localhost:9090/api/v1/admin/tsdb/clean_tombstones
```

### Étape 5 — Action long terme

- Ajuster la rétention Prometheus (`--storage.tsdb.retention.time=15d`)
- Configurer une rotation des logs avec `logrotate`
- Envisager l'extension du volume ou le déplacement vers un stockage externe

---

## 7. Ajouter une nouvelle métrique custom NestJS

### Exemple complet — Counter + Histogram

#### 7.1 Déclarer les providers dans `MetricsModule`

Dans `src/metrics/metrics.module.ts`, ajouter dans le tableau `providers` :

```typescript
import { makeCounterProvider, makeHistogramProvider } from '@willsoto/nestjs-prometheus';

// Dans providers[] du @Module :
makeCounterProvider({
  name: 'subscription_events_total',
  help: "Nombre total d'événements d'abonnement",
  labelNames: ['event_type', 'plan'],
}),
makeHistogramProvider({
  name: 'subscription_processing_duration_seconds',
  help: "Durée de traitement des abonnements en secondes",
  labelNames: ['plan'],
  buckets: [0.1, 0.5, 1, 2, 5],
}),
```

Ne pas oublier d'ajouter les noms dans le tableau `exports` si le service doit être utilisé hors du module.

#### 7.2 Injecter dans `MetricsService`

Dans `src/metrics/metrics.service.ts` :

```typescript
import { Counter, Histogram } from 'prom-client';
import { InjectMetric } from '@willsoto/nestjs-prometheus';

@Injectable()
export class MetricsService {
  constructor(
    // ... métriques existantes ...
    @InjectMetric('subscription_events_total')
    private readonly subscriptionEventsCounter: Counter<string>,
    @InjectMetric('subscription_processing_duration_seconds')
    private readonly subscriptionDurationHistogram: Histogram<string>,
  ) {}

  enregistrerEvenementAbonnement(eventType: string, plan: string): void {
    this.subscriptionEventsCounter.inc({ event_type: eventType, plan });
  }

  observerDureeAbonnement(plan: string, durationSeconds: number): void {
    this.subscriptionDurationHistogram.observe({ plan }, durationSeconds);
  }
}
```

#### 7.3 Utiliser dans un service métier

```typescript
import { Injectable } from '@nestjs/common';
import { MetricsService } from 'src/metrics/metrics.service';

@Injectable()
export class SubscriptionService {
  constructor(private readonly metricsService: MetricsService) {}

  async creerAbonnement(userId: string, plan: string): Promise<void> {
    const debut = Date.now();

    // ... logique métier ...

    const durationSeconds = (Date.now() - debut) / 1000;
    this.metricsService.enregistrerEvenementAbonnement('created', plan);
    this.metricsService.observerDureeAbonnement(plan, durationSeconds);
  }
}
```

#### 7.4 Importer `MetricsModule` dans le module cible

Dans `src/subscription/subscription.module.ts` :

```typescript
import { MetricsModule } from 'src/metrics/metrics.module';

@Module({
  imports: [MetricsModule],
  // ...
})
export class SubscriptionModule {}
```

#### 7.5 Vérifier que la métrique est bien exposée

```bash
curl http://localhost:3000/metrics | grep subscription_events_total
```

---

## 8. Ajouter un nouveau dashboard Grafana et le versionner

### 8.1 Créer le fichier JSON du dashboard

Créer un fichier dans `docker/grafana/dashboards/` :

```bash
touch docker/grafana/dashboards/mon-nouveau-dashboard.json
```

Structure minimale d'un dashboard Grafana JSON :

```json
{
  "uid": "mon-nouveau-dashboard",
  "title": "Mon Nouveau Dashboard",
  "tags": ["healthai", "custom"],
  "timezone": "browser",
  "schemaVersion": 38,
  "version": 1,
  "refresh": "30s",
  "panels": [
    {
      "id": 1,
      "title": "Ma métrique",
      "type": "timeseries",
      "gridPos": { "h": 8, "w": 24, "x": 0, "y": 0 },
      "targets": [
        {
          "datasource": { "type": "prometheus", "uid": "prometheus" },
          "expr": "ma_metrique_total",
          "legendFormat": "Valeur"
        }
      ],
      "fieldConfig": { "defaults": { "unit": "short" } }
    }
  ],
  "time": { "from": "now-1h", "to": "now" }
}
```

### 8.2 Rechargement automatique

Grafana vérifie le dossier de dashboards toutes les 30 secondes (configurable via `updateIntervalSeconds` dans `dashboards.yml`). Le dashboard apparaît automatiquement dans le dossier **HealthAI Coach**.

### 8.3 Exporter un dashboard existant depuis l'UI

1. Ouvrir Grafana → le dashboard à versionner
2. Cliquer sur l'icône **Partager** → **Exporter** → **Enregistrer dans un fichier**
3. Placer le fichier JSON dans `docker/grafana/dashboards/`
4. Committer le fichier dans git

### 8.4 Bonne pratique de nommage

- Fichier : `kebab-case.json` (ex. `subscription-analytics.json`)
- `uid` : identique au nom du fichier sans extension (pour éviter les conflits)
- `tags` : toujours inclure `"healthai"` + un tag de domaine

### 8.5 Versionner les modifications

```bash
git add docker/grafana/dashboards/mon-nouveau-dashboard.json
git commit -m "feat(monitoring): ajout dashboard <nom> Grafana"
```

---

## 9. Migration ELK → Loki

### Pourquoi migrer vers Loki ?

| Critère             | ELK (Elasticsearch + Logstash + Kibana) | Loki + Grafana                        |
|---------------------|-----------------------------------------|---------------------------------------|
| Consommation RAM    | Élevée (Elasticsearch : 4–8 Go min)     | Faible (Loki : < 512 Mo)              |
| Indexation          | Full-text sur tous les champs           | Labels uniquement (logs non indexés)  |
| Coût d'exploitation | Élevé                                   | Faible                                |
| Intégration Grafana | Via plugin (Kibana séparé)              | Natif                                 |
| Scalabilité         | Complexe (cluster ES)                   | Simple (stockage objet S3 compatible) |
| Courbe d'apprentissage | Steep (DSL Elasticsearch)            | Progressive (LogQL proche de PromQL)  |

Loki est plus adapté à notre contexte (hébergement contraint, stack Grafana déjà présente).

### Plan de migration

#### Étape 1 — Paralléliser (phase transitoire)

Pendant 1 à 2 semaines, envoyer les logs vers ELK **et** Loki simultanément pour valider que Loki capte bien tous les logs.

```yaml
# Dans promtail-config.yml, ajouter un client ELK si nécessaire
# (ou conserver Logstash en parallèle)
clients:
  - url: http://loki:3100/loki/api/v1/push
```

#### Étape 2 — Valider les requêtes LogQL équivalentes

| Requête Kibana / Elasticsearch           | Équivalent LogQL                                       |
|------------------------------------------|--------------------------------------------------------|
| `level: ERROR`                           | `{service="backend-nestjs"} \| json \| level="ERROR"` |
| `message: "timeout"`                     | `{service="backend-nestjs"} \|= "timeout"`            |
| `@timestamp > now-1h AND level: WARN`    | `{service="backend-nestjs"} \| json \| level="WARN"`  |

#### Étape 3 — Migrer les alertes

Les alertes basées sur les logs Elasticsearch → recréer dans Grafana avec la datasource Loki :

```logql
# Exemple : alerte si plus de 10 erreurs en 5 minutes
count_over_time({service="backend-nestjs"} |= "ERROR" [5m]) > 10
```

#### Étape 4 — Arrêter ELK

Une fois les dashboards et alertes Loki validés en production :

```bash
# Arrêter les services ELK
docker compose -f docker-compose.elk.yml down

# Optionnel : supprimer les volumes ELK
docker volume rm elasticsearch-data kibana-data
```

#### Étape 5 — Nettoyage

- Supprimer les configurations Logstash/Beats
- Archiver les anciens dashboards Kibana (export JSON)
- Documenter la date de bascule dans ce fichier

---

## 10. Configuration des ports

| Service        | Port hôte | Port conteneur | Accès externe         |
|----------------|-----------|----------------|-----------------------|
| Backend NestJS | 3000      | 3000           | API principale        |
| Grafana        | 3001      | 3000           | Dashboards            |
| Loki           | 3100      | 3100           | Ingestion logs        |
| Prometheus     | 9090      | 9090           | Métriques / PromQL    |
| AlertManager   | 9093      | 9093           | Gestion alertes       |
| Node Exporter  | 9100      | 9100           | Métriques hôte        |
| cAdvisor       | 8081      | 8080           | Métriques conteneurs  |
| FastAPI (IA)   | 8000      | 8000           | API IA                |
| phpMyAdmin     | 8080      | 80             | Administration MariaDB|
| Promtail       | 9080      | 9080           | Healthcheck           |

> **Note :** cAdvisor est exposé sur le port `8081` côté hôte (et non `8080`) pour éviter le conflit avec phpMyAdmin.

### Réseau Docker

Tous les services de monitoring appartiennent au réseau bridge `monitoring`. Le backend NestJS et la FastAPI sont contactés via `host.docker.internal` (accès à l'hôte depuis le conteneur).

Pour intégrer le backend dans le réseau `monitoring` (recommandé en production) :

```yaml
# Dans compose.yaml (backend)
networks:
  - monitoring

# Puis mettre à jour prometheus.yml pour cibler le nom du service
# au lieu de host.docker.internal
```
