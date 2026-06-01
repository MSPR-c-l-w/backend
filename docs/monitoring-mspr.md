# Système de Supervision — HealthAI Coach
### Documentation Technique & Méthodologique — MSPR TPRE502 / TPRE601

---

**Projet :** HealthAI Coach Backend  
**Stack applicative :** NestJS · TypeScript · MariaDB · Prisma ORM  
**Stack de supervision :** Prometheus · Grafana · Loki · AlertManager  
**Année :** 2025 – 2026 | CDA-DIADS — EPSI  

---

## Table des matières

1. [Contexte et enjeux du monitoring](#1-contexte-et-enjeux-du-monitoring)
2. [Choix technologiques et justification](#2-choix-technologiques-et-justification)
3. [Architecture de la supervision](#3-architecture-de-la-supervision)
4. [Ce qui est mesuré et pourquoi](#4-ce-qui-est-mesuré-et-pourquoi)
5. [Dashboards — Analyse par domaine](#5-dashboards--analyse-par-domaine)
6. [Stratégie d'alerting](#6-stratégie-dalerting)
7. [Centralisation des logs](#7-centralisation-des-logs)
8. [Problèmes détectés et corrections apportées](#8-problèmes-détectés-et-corrections-apportées)
9. [Limites identifiées et axes d'amélioration](#9-limites-identifiées-et-axes-damélioration)

---

## 1. Contexte et enjeux du monitoring

### 1.1 Pourquoi superviser HealthAI Coach ?

HealthAI Coach est une plateforme de suivi santé et fitness exposant une API REST NestJS consommée par un back-office (Next.js) et potentiellement une application mobile. Plusieurs caractéristiques de ce projet rendent la supervision indispensable :

**Des pipelines ETL critiques.** Le backend intègre trois pipelines d'import de données (nutrition, exercise, health-profile) qui effectuent des appels réseau vers des datasets externes (Kaggle), des transformations volumineuses, et écrivent dans des tables de staging. Une exécution longue ou une anomalie peut passer inaperçue sans instrumentation dédiée.

**Une contrainte mémoire réelle.** Sur macOS (environnement de développement), la limite de heap V8 par défaut est ~60 MB. Le process NestJS au repos consomme déjà ~57 MB, soit 96% de la limite — un seuil propice aux crashs OOM silencieux.

**Des appels vers des APIs IA externes.** Le backend interagit avec des services IA tiers (FastAPI). Leur disponibilité et leur cadence d'utilisation doivent être tracées pour anticiper des quotas ou des dégradations de service.

**Un besoin de traçabilité des données.** La qualité des données importées (taux d'anomalies dans les staging tables) est un indicateur métier directement exploitable par le back-office.

### 1.2 Les trois niveaux de supervision retenus

| Niveau | Question à laquelle on répond | Outil |
|---|---|---|
| **Applicatif** | Est-ce que l'API répond correctement, rapidement ? | Prometheus + métriques NestJS custom |
| **Système** | Est-ce que la machine tient la charge ? | Prometheus + Node Exporter |
| **Logs** | Qu'est-ce qui s'est passé exactement, et quand ? | Loki + Promtail + Grafana |

---

## 2. Choix technologiques et justification

### 2.1 Pourquoi Prometheus + Grafana ?

Prometheus est un système de collecte de métriques par **scrape pull** : il interroge périodiquement (toutes les 15s) les endpoints `/metrics` exposés par les services. Ce modèle est particulièrement adapté à notre contexte pour plusieurs raisons :

- **Légèreté** : Prometheus ne nécessite pas d'agent lourd côté application. La bibliothèque `prom-client` (NestJS) ajoute quelques Ko au bundle, rien de plus.
- **Format standard** : le format OpenMetrics est supporté nativement par NestJS via `@willsoto/nestjs-prometheus`, sans surcouche complexe.
- **Modèle de données adapté** : les métriques de type Counter, Histogram et Gauge correspondent exactement aux besoins (comptage de requêtes, latences, usage mémoire).
- **Langage de requête puissant** : PromQL permet d'exprimer des calculs complexes (percentiles, taux, ratios) directement dans Grafana sans pipeline de transformation supplémentaire.
- **Standard CNCF** : ecosystème mature, maintenu, documenté, avec de nombreux exporters prêts à l'emploi (Node Exporter, AlertManager).

Grafana s'impose naturellement comme couche de visualisation car il gère nativement Prometheus **et** Loki dans la même interface, ce qui permet de corréler une alerte métrique avec les logs correspondants sans changer d'outil.

### 2.2 Pourquoi pas ELK (Elasticsearch + Logstash + Kibana) ?

La stack ELK est une solution pertinente pour des besoins de **recherche full-text dans des logs massifs**, mais elle présente des contraintes inadaptées à ce projet :

| Critère | ELK | Prometheus + Grafana + Loki |
|---|---|---|
| **Consommation RAM** | Elasticsearch : min. 2–4 GB | Prometheus : ~200 MB, Loki : ~100 MB |
| **Complexité de setup** | Haute (3 services + beats/agents) | Moyenne (6 services, configs YAML simples) |
| **Métriques temps-réel** | Non natif (nécessite Metricbeat + Elasticsearch) | Natif Prometheus |
| **Corrélation logs/métriques** | Nécessite un outil tiers | Natif dans Grafana (même interface) |
| **Indexation des logs** | Full-text (coûteux en disque) | Labels + streaming (économique) |
| **Adapté à un dev macOS** | Non (trop lourd) | Oui |

Loki (l'alternative retenue) adopte un modèle d'indexation minimaliste : seuls les **labels** sont indexés, pas le contenu des logs. Cela réduit considérablement la consommation disque et la complexité opérationnelle, au prix d'une recherche full-text moins performante — ce qui est un compromis acceptable pour ce projet.

### 2.3 Pourquoi pas Datadog, New Relic ou autres SaaS ?

Les solutions SaaS de monitoring (Datadog, New Relic, Dynatrace) offrent une expérience out-of-the-box mais présentent deux inconvénients rédhibitoires dans le cadre de la MSPR :

1. **Coût** : ces outils sont payants au-delà d'un quota de métriques/logs limité.
2. **Envoi de données vers l'extérieur** : les données de santé des utilisateurs (health profiles) ne doivent pas transiter par des services tiers sans consentement explicite — un enjeu RGPD direct.

La stack choisie est **100% auto-hébergée**, les données ne quittent jamais l'infrastructure locale ou le serveur de production.

### 2.4 Synthèse des choix

```
Besoin identifié                   Solution retenue          Alternative écartée
────────────────────────────────────────────────────────────────────────────────
Métriques temps-réel (pull)    →   Prometheus               Datadog, InfluxDB
Visualisation + dashboards     →   Grafana                  Kibana, Metabase
Centralisation des logs        →   Loki + Promtail          ELK, Graylog
Alerting                       →   AlertManager             PagerDuty (payant)
Métriques système hôte         →   Node Exporter            cAdvisor (incompatible macOS)
Métriques conteneurs macOS     →   Docker Daemon Metrics    cAdvisor (incompatible)
```

---

## 3. Architecture de la supervision

### 3.1 Vue d'ensemble

```
┌──────────────────────────────────────────────────────────────────┐
│                      SOURCES DE MÉTRIQUES                        │
│                                                                  │
│  ┌─────────────────┐   ┌──────────────┐   ┌──────────────────┐  │
│  │  NestJS :3001   │   │  FastAPI     │   │  Node Exporter   │  │
│  │  /metrics       │   │  :8000       │   │  :9100           │  │
│  │  http_requests  │   │  /metrics    │   │  CPU / RAM /     │  │
│  │  etl_pipeline   │   │  (si dispo)  │   │  Disque / Réseau │  │
│  │  ai_api_calls   │   └──────────────┘   └──────────────────┘  │
│  │  nodejs_*       │                                             │
│  └─────────────────┘   ┌──────────────────────────────────────┐  │
│                        │  Docker Daemon :9323                  │  │
│                        │  conteneurs running/stopped/events    │  │
│                        └──────────────────────────────────────┘  │
└──────────────────────────────┬───────────────────────────────────┘
                               │ scrape toutes les 15s
                               ▼
                  ┌────────────────────────┐
                  │    Prometheus :9090     │
                  │    TSDB (15j rétention) │
                  │    Évaluation alertes  │
                  └──────────┬─────────────┘
                             │ règles alerts.yml
                             ▼
                  ┌────────────────────────┐
                  │   AlertManager :9093   │
                  │   Déduplication        │
                  │   Silences / Webhooks  │
                  └────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                          LOGS                                    │
│  Docker stdout/stderr ──► Promtail ──► Loki :3100               │
│  (labels: container, service, level, component)                  │
└──────────────────────────────┬───────────────────────────────────┘
                               │ LogQL
                               ▼
                  ┌────────────────────────┐
                  │     Grafana :3002      │
                  │   datasource: Prometheus│
                  │   datasource: Loki     │
                  │   5 dashboards         │
                  └────────────────────────┘
```

### 3.2 Services déployés

| Service | Image | Port | Persistance |
|---|---|---|---|
| Prometheus | `prom/prometheus:v2.51.2` | 9090 | Volume `prometheus-data` |
| Grafana | `grafana/grafana:10.4.3` | 3002 | Volume `grafana-data` |
| AlertManager | `prom/alertmanager:v0.27.0` | 9093 | — |
| Loki | `grafana/loki:3.0.0` | 3100 | Volume `loki-data` |
| Promtail | `grafana/promtail:3.0.0` | 9080 | — |
| Node Exporter | `prom/node-exporter:v1.8.1` | 9100 | — |

Tous ces services sont isolés dans un réseau Docker bridge dédié `monitoring`, déclaré dans `docker/docker-compose.monitoring.yml`. Les dashboards Grafana sont **provisionnés automatiquement** depuis `docker/grafana/dashboards/` — aucune configuration manuelle requise au démarrage.

### 3.3 Intégration côté NestJS

L'instrumentation applicative repose sur trois fichiers dans `src/metrics/` :

| Fichier | Rôle |
|---|---|
| `metrics.module.ts` | Déclare les métriques (Counters, Histograms) et active le middleware |
| `metrics.service.ts` | Service injectable exposant les méthodes d'incrémentation/observation |
| `metrics.middleware.ts` | Intercepte toutes les requêtes HTTP, mesure la latence réelle |

Le middleware utilise `process.hrtime.bigint()` pour mesurer la durée avec une précision nanoseconde, convertie en secondes pour Prometheus. Il s'applique à toutes les routes (`forRoutes('*')`) et s'auto-exclut de `/metrics` pour éviter la récursion.

---

## 4. Ce qui est mesuré et pourquoi

### 4.1 Métriques HTTP — Santé de l'API

**`http_requests_total`** — *Counter, labels : route, method, status_code*

Comptabilise chaque requête reçue. Permet de calculer :
- Le **débit** de l'API (requêtes/seconde) — indicateur de charge
- Le **taux d'erreurs 4xx** — erreurs client (mauvaises requêtes, non autorisées)
- Le **taux d'erreurs 5xx** — erreurs serveur (bugs, pannes DB, OOM)

Un taux 5xx supérieur à 1% déclenche une alerte critique. Un taux 4xx supérieur à 10% signale soit une mauvaise utilisation de l'API, soit une tentative d'accès non autorisée.

---

**`http_request_duration_seconds`** — *Histogram, labels : route, method*

Mesure la latence de chaque requête. Les buckets configurés (50ms, 100ms, 250ms, 500ms, 1s) permettent de calculer des percentiles précis via PromQL :

```promql
# Latence au 95e percentile sur toutes les routes
histogram_quantile(0.95,
  sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
)
```

Le **p95** (95e percentile) est l'indicateur SLA standard : il représente l'expérience des 5% d'utilisateurs les moins bien servis. Un p95 > 2s déclenche une alerte.

### 4.2 Métriques ETL — Suivi des pipelines

**`etl_pipeline_duration_seconds`** — *Histogram, label : pipeline*

Mesure la durée d'exécution de chacun des trois pipelines (`nutrition`, `exercise`, `health-profile`). Les buckets sont calibrés sur les durées observées (1s, 5s, 10s, 30s, 60s, 120s, 300s).

Cette métrique est essentielle car un pipeline lent peut :
- Bloquer la base de données pendant son exécution (verrous Prisma)
- Provoquer un pic de consommation mémoire (objets temporaires accumulés)
- Retarder la disponibilité des données pour le back-office

L'alerte `ETLPipelineNotRun` (info, délai 0m) se déclenche si aucun pipeline n'a été exécuté depuis 24h — signalant un risque de données obsolètes.

### 4.3 Métriques IA — Traçabilité des appels externes

**`ai_api_calls_total`** — *Counter, labels : provider, type*

Comptabilise chaque appel vers les APIs IA externes. Permet de :
- Surveiller la **cadence** d'utilisation et anticiper des quotas
- Détecter une **dégradation** du service IA (baisse soudaine du compteur)
- Analyser la **répartition par type** (génération de programme, workout, etc.)

### 4.4 Métriques Node.js Runtime — Santé du process

Ces métriques sont collectées automatiquement par `prom-client` (`defaultMetrics: { enabled: true }`).

| Métrique | Ce qu'elle révèle | Seuil d'alerte |
|---|---|---|
| `nodejs_eventloop_lag_p99_seconds` | L'event loop est-elle bloquée ? Une valeur élevée signifie que des opérations synchrones bloquent le traitement des requêtes. | > 500ms → warning |
| `nodejs_heap_size_used_bytes` | Quelle fraction du heap V8 est occupée ? Proche de 100% = risque de crash OOM. | > 85% total → warning |
| `nodejs_gc_duration_seconds{gctype}` | Quelle est la fréquence et la durée des cycles de garbage collection ? Un major GC fréquent signale une fuite mémoire. | Observatoire |
| `nodejs_active_handles_total` | Combien de connexions/timers libuv sont ouverts ? Une croissance continue signale une fuite de ressources. | Observatoire |

### 4.5 Métriques système — Santé de l'hôte

| Métrique | Ce qu'elle révèle | Seuil |
|---|---|---|
| `node_cpu_seconds_total{mode="idle"}` | CPU disponible sur l'hôte | > 80% utilisé → warning |
| `node_memory_MemAvailable_bytes` | RAM disponible | > 85% utilisée → warning |
| `node_filesystem_avail_bytes` | Espace disque restant | < 15% → critical |
| `engine_daemon_container_states_containers` | Nombre de conteneurs par état | Observatoire |

---

## 5. Dashboards — Analyse par domaine

Cinq dashboards Grafana sont provisionnés, chacun adressant un périmètre précis.

### 5.1 Stack Overview — Vue infrastructure

**Objectif :** donner en un coup d'œil l'état global de l'infrastructure.

Ce dashboard répond à la question : *"Est-ce que tous les services sont opérationnels ?"*

Il affiche l'état de chaque target Prometheus (`up == 1`), l'utilisation CPU et RAM de l'hôte, et le nombre de conteneurs Docker actifs. C'est le premier écran à consulter en cas d'alerte.

### 5.2 API NestJS — Santé applicative

**Objectif :** surveiller la santé et les performances de l'API en production.

Ce dashboard est organisé en niveaux de lecture :

**Niveau 1 — Indicateurs instantanés (stat panels)**

Six gauges affichent en temps réel les métriques les plus critiques avec un code couleur vert/jaune/rouge :

| Indicateur | Seuil jaune | Seuil rouge | Justification |
|---|---|---|---|
| Requêtes/s | > 10 | > 50 | Détecte les pics de charge anormaux |
| Erreurs 4xx % | > 5% | > 10% | Signale un problème d'autorisation ou de format |
| Erreurs 5xx % | — | > 1% | Tout bug serveur est critique |
| Event Loop Lag p99 | > 100ms | > 500ms | Dégradation perceptible par l'utilisateur |
| Heap utilisé % | > 70% | > 85% | Marge avant crash OOM |
| CPU process % | > 50% | > 80% | Sur-utilisation CPU |

**Niveau 2 — Séries temporelles**

Les timeseries permettent d'analyser les **tendances** et de corréler des événements (ex : pic de latence au moment d'un import ETL).

**Niveau 3 — Logs en temps réel**

Le panneau Loki en bas du dashboard stream les logs `ERROR` de NestJS. Cela permet de corréler immédiatement une hausse du taux d'erreur 5xx avec le message d'exception correspondant.

### 5.3 ETL Pipelines — Suivi des imports

**Objectif :** suivre l'exécution des trois pipelines ETL.

Ce dashboard répond à : *"Les imports fonctionnent-ils ? Sont-ils performants ?"*

Pour chaque pipeline, on analyse :
- Le **nombre de runs** sur la période (a-t-il été déclenché ?)
- La **durée moyenne** (est-il plus lent qu'habituellement ?)
- La **durée p95** (y a-t-il des exécutions anormalement longues ?)

Les seuils de durée sont différenciés par pipeline car leurs volumes de données sont hétérogènes :

| Pipeline | Seuil normal | Seuil dégradé |
|---|---|---|
| Nutrition | < 30s | > 60s |
| Exercise | < 60s | > 120s |
| Health Profile | < 10s | > 30s |

### 5.4 AI Services — Consommation IA

**Objectif :** tracer l'usage des APIs IA externes et détecter leur indisponibilité.

Ce dashboard est particulièrement utile pour anticiper une saturation de quota (si l'API IA est facturée à l'appel) et pour confirmer que le service répond bien (`up == 1` pour le target FastAPI).

### 5.5 Routes Analytics — Analyse par endpoint

**Objectif :** identifier les routes les plus sollicitées, les plus lentes, et celles générant le plus d'erreurs.

Ce dashboard est l'outil principal d'**optimisation de performance**. Le tableau interactif (triable) affiche pour chaque route × méthode HTTP :

- Volume total de requêtes sur la période
- Latence moyenne, p5 (minimum réel), p95, p99
- Taux d'erreur (4xx + 5xx / total)

Un fond rouge apparaît automatiquement si le taux d'erreur dépasse 5% ou si la latence p95 dépasse le seuil configuré. Cela permet d'identifier d'un regard les routes problématiques sans requête PromQL manuelle.

**Cas d'usage typique :** après un déploiement, trier par "Taux d'erreur" pour détecter une régression sur une route spécifique.

---

## 6. Stratégie d'alerting

### 6.1 Philosophie

Les alertes sont conçues selon le principe **SRE (Site Reliability Engineering)** : alerter sur des **symptômes** perceptibles par l'utilisateur, pas uniquement sur des causes techniques internes. Une alerte ne doit se déclencher que si elle nécessite une action humaine.

Trois niveaux de sévérité sont définis :

| Sévérité | Signification | Action attendue |
|---|---|---|
| `critical` | Impact direct sur les utilisateurs / données | Intervention immédiate |
| `warning` | Dégradation en cours, seuil de sécurité approché | Surveillance accrue, action préventive |
| `info` | Anomalie non bloquante, donnée potentiellement obsolète | Vérification planifiée |

### 6.2 Règles d'alerte — Groupe SLA Service

```yaml
# Service complètement indisponible
- alert: ServiceDown
  expr: up == 0
  for: 1m          # délai anti-flap : évite les faux positifs sur redémarrage
  severity: critical

# Rafale d'erreurs serveur
- alert: HighErrorRate5xx
  expr: sum(rate(http_requests_total{status_code=~"5.."}[1m]))
        / sum(rate(http_requests_total[1m])) * 100 > 5
  for: 1m
  severity: critical

# Dégradation UX perceptible
- alert: HighLatency
  expr: histogram_quantile(0.95,
          sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
        ) > 2
  for: 2m           # maintenu 2 minutes avant alerte (évite les pics ponctuels)
  severity: warning
```

### 6.3 Règles d'alerte — Groupe Node.js Runtime

```yaml
# Event loop saturée
- alert: HighEventLoopLag
  expr: nodejs_eventloop_lag_p99_seconds > 0.5
  for: 2m
  severity: warning
  # Impact : toutes les requêtes HTTP sont ralenties ou time-out

# Heap proche de la limite
- alert: HighHeapUsage
  expr: nodejs_heap_size_used_bytes
        / nodejs_heap_size_total_bytes * 100 > 85
  for: 5m           # délai long : fluctuations normales fréquentes après GC
  severity: warning
  # Impact : risque de crash OOM dans les minutes suivantes
```

### 6.4 Règles d'alerte — Groupe Infrastructure

```yaml
- alert: HighCpuUsage         # CPU hôte > 80%   for: 2m   warning
- alert: HighMemoryUsage      # RAM > 85%         for: 5m   warning
- alert: DiskSpaceLow         # Disque < 15%      for: 0m   critical
  # for: 0m = alerte immédiate, sans délai (le disque plein est toujours critique)
```

### 6.5 Règle d'alerte — Groupe ETL

```yaml
- alert: ETLPipelineNotRun
  expr: time() - etl_pipeline_duration_seconds_created > 86400
  for: 0m
  severity: info
  # Déclenché si aucun pipeline n'a tourné depuis 24h
  # Données potentiellement obsolètes dans les staging tables
```

### 6.6 Pourquoi des délais (`for`) différents ?

Le paramètre `for` définit la durée pendant laquelle l'expression doit rester vraie avant de déclencher l'alerte. Un délai trop court génère des faux positifs (pics ponctuels normaux) ; un délai trop long retarde la détection.

| Alerte | `for` | Justification |
|---|---|---|
| `ServiceDown` | 1m | Un service redémarre en < 30s normalement |
| `HighHeapUsage` | 5m | Le GC fait naturellement fluctuer le heap |
| `DiskSpaceLow` | 0m | L'espace disque ne remonte pas tout seul |
| `HighLatency` | 2m | Un pic de latence isolé (ETL en cours) est normal |

---

## 7. Centralisation des logs

### 7.1 Pourquoi Loki plutôt que ELK ?

Comme détaillé en section 2, Loki adopte un modèle d'indexation par **labels uniquement** (pas de full-text). Les logs sont stockés compressés, et la recherche s'effectue via des filtres de streaming (`|= "ERROR"`, `|~ "regex"`). Ce modèle consomme 10x moins de ressources qu'Elasticsearch pour un usage de recherche opérationnelle.

### 7.2 Pipeline de collecte

Promtail scrape le **socket Docker** (`/var/run/docker.sock`) et collecte les logs stdout/stderr de tous les conteneurs. Il enrichit chaque entrée avec des labels extraits du contexte Docker :

| Label | Valeur exemple | Origine |
|---|---|---|
| `container` | `backend-nestjs` | Nom du conteneur Docker |
| `service` | `grafana` | Label docker-compose |
| `level` | `ERROR`, `WARN` | Extrait par regex du log NestJS |
| `component` | `backend`, `ai` | Calculé depuis le nom du conteneur |

Les requêtes `GET /health` et `GET /metrics` sont filtrées en amont par Promtail (pas indexées dans Loki) pour éviter un bruit de fond important.

### 7.3 Requêtes LogQL opérationnelles

```logql
# Tous les logs ERROR du backend
{container="backend-nestjs"} |= "ERROR"

# Logs liés aux pipelines ETL
{container="backend-nestjs"} |~ "pipeline|ETL|import"

# Erreurs et avertissements toutes sources
{level=~"ERROR|WARN"}

# Fréquence d'erreurs (pour panels Grafana)
sum(rate({container="backend-nestjs", level="ERROR"}[1m]))
```

### 7.4 Corrélation logs / métriques dans Grafana

L'intérêt majeur de l'association Prometheus + Loki dans Grafana est la **corrélation temporelle**. Depuis n'importe quel panel de métrique (ex : pic d'erreurs 5xx), il est possible de cliquer sur un point de la timeseries et d'ouvrir directement les logs Loki correspondant à ce moment précis — sans changer d'outil ni copier un timestamp.

---

## 8. Problèmes détectés et corrections apportées

Cette section documente les problèmes réels rencontrés lors de la mise en place de la supervision et les solutions appliquées. Elle constitue la partie **audit** du document.

### 8.1 Crash OOM du process NestJS (Heap saturé à 96%)

**Problème détecté :** au démarrage standard, `nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes` atteignait **96%** sur macOS. Tout appel HTTP entraînant une allocation mémoire (Prisma, JSON parsing) pouvait provoquer un crash `JavaScript heap out of memory`.

**Cause identifiée :** la limite de heap V8 par défaut sur macOS ARM/x64 est ~60 MB. Le bundle NestJS + client Prisma + registre `prom-client` consomment ~57 MB au repos.

**Correction appliquée :**

```bash
# package.json
"start:prod": "node --max-old-space-size=512 --expose-gc dist/main.js"
```

```json
// nest-cli.json
{ "exec": "node --max-old-space-size=512 --expose-gc" }
```

```typescript
// src/main.ts — GC forcé toutes les 30s après un pipeline ETL
if (typeof global.gc === 'function') {
  setInterval(() => { global.gc!(); }, 30_000);
}
```

**Résultat :** le ratio heap utilisé est passé de **96% à ~11%**, éliminant le risque de crash OOM en développement et staging.

---

### 8.2 Crash Prometheus au démarrage (erreur 502 dans Grafana)

**Problème détecté :** Grafana retournait une erreur 502 sur tous les panels après un démarrage à froid.

**Cause identifiée :** `alerts.yml` contenait des fonctions `mul` et `mulf` dans les templates d'annotations — fonctions qui n'existent pas dans le moteur de templates Prometheus. Ce bug provoquait le crash de Prometheus au démarrage, avant qu'il puisse rejoindre le réseau Docker.

**Symptôme caractéristique :** `docker inspect prometheus` ne retournait aucune IP dans le réseau `monitoring` (le conteneur n'avait pas démarré correctement).

**Correction appliquée :** remplacement de `{{ $value | mul 1000 }}ms` par `{{ printf "%.3f" $value }}s` dans toutes les annotations.

**Leçon retenue :** toujours valider la configuration Prometheus avec `--check-config` avant un redéploiement :
```bash
docker run --rm -v $(pwd)/prometheus:/etc/prometheus \
  prom/prometheus:v2.51.2 \
  --config.file=/etc/prometheus/prometheus.yml --check-config
```

---

### 8.3 Incompatibilité cAdvisor sur macOS

**Problème détecté :** cAdvisor (solution standard pour les métriques par conteneur) ne remontait pas les conteneurs du projet sur macOS/Rancher Desktop.

**Cause identifiée :** sur macOS, Docker tourne dans une VM Lima. cAdvisor s'exécute à l'intérieur de cette VM et voit les processus Linux internes (k3s, CoreDNS, Traefik…) mais pas les conteneurs Docker nommés du projet. Ce comportement est **architectural** et non contournable.

**Solution retenue :** activation des **Docker Daemon Metrics** sur le port `9323` (option `metrics-addr` du daemon Docker) :

```json
// /etc/docker/daemon.json (dans la VM Lima)
{ "metrics-addr": "0.0.0.0:9323", "experimental": true }
```

Métriques disponibles via ce mécanisme :
- `engine_daemon_container_states_containers{state}` — running/stopped/paused
- `engine_daemon_events_total` — start/stop/die
- `engine_daemon_engine_memory_bytes` — RAM disponible pour Docker

**Limitation acceptée :** ces métriques ne donnent pas de détail par conteneur (pas de CPU/RAM par conteneur). Cela sera résolu en production Linux avec cAdvisor.

---

### 8.4 Panels Loki envoyant les requêtes à Prometheus

**Problème détecté :** les panels de type "Logs" dans les dashboards Grafana retournaient une erreur `unexpected character '|'`.

**Cause identifiée :** la datasource Loki était définie uniquement au niveau du `target` mais pas au niveau du `panel`. Grafana envoyait alors les requêtes LogQL à la datasource par défaut (Prometheus), qui ne comprend pas le `|` de LogQL.

**Correction appliquée :** définir la datasource aux deux niveaux dans le JSON du dashboard :

```json
{
  "type": "logs",
  "datasource": { "type": "loki", "uid": "loki" },
  "targets": [{
    "datasource": { "type": "loki", "uid": "loki" },
    "expr": "{container=\"backend-nestjs\"} |= \"ERROR\""
  }]
}
```

---

## 9. Limites identifiées et axes d'amélioration

### 9.1 Limites actuelles

| Limite | Impact | Contexte |
|---|---|---|
| Pas de métriques CPU/RAM par conteneur | Impossible de savoir quel conteneur consomme le plus | macOS uniquement — corrigé en production Linux avec cAdvisor |
| Logs NestJS non collectés en dev natif | Si `npm run start:dev` (hors Docker), aucun log dans Loki | Promtail scrape uniquement le socket Docker |
| Rétention Prometheus non configurée | Par défaut 15j — peut saturer le disque sur le long terme | À paramétrer via `--storage.tsdb.retention.time=30d` |
| AlertManager sans destination configurée | Les alertes sont visibles dans l'UI mais n'envoient pas de notification | Webhooks Slack/email à configurer pour la production |
| Pas de monitoring des WebSockets | Les connexions Socket.IO ne sont pas tracées | À instrumenter via un gauge `websocket_connections_active` |

### 9.2 Axes d'amélioration pour la production

**Court terme :**
- Configurer AlertManager pour envoyer les alertes vers Slack ou un webhook (PagerDuty, OpsGenie)
- Définir une rétention explicite pour Prometheus (30j recommandé)
- Ajouter une alerte sur la qualité des données ETL (% d'anomalies > seuil)

**Moyen terme :**
- Remplacer Docker Daemon Metrics par cAdvisor sur le serveur Linux de production
- Instrumenter les WebSockets (`websocket_connections_active`)
- Ajouter des SLO (Service Level Objectives) formels dans Grafana

**Long terme :**
- Envisager Grafana Tempo pour le **tracing distribué** (corrélation requête → DB → API IA)
- Mettre en place des sondes de disponibilité externes (Blackbox Exporter) pour mesurer la disponibilité depuis l'extérieur

---

*Documentation rédigée dans le cadre de la MSPR TPRE502 / TPRE601 — HealthAI Coach — CDA-DIADS EPSI — Juin 2026*
