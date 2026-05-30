# Rapport de tests de performance (K6) — TPRE601

**Outil :** [Grafana k6](https://k6.io/)  
**Scénario :** `perf/smoke.js`  
**Script :** [scripts/run-k6.sh](./scripts/run-k6.sh)  
**Date :** 30 mai 2026

---

## 1. Objectif

Mesurer les temps de réponse et le comportement de l'API sous charge légère (smoke test) avant soutenance TPRE601.

## 2. Configuration du scénario

| Paramètre           | Valeur                                                   |
| ------------------- | -------------------------------------------------------- |
| Virtual Users (VUs) | 50                                                       |
| Durée               | 2 minutes                                                |
| Ramp-up             | 30 s (0 → 50 VUs)                                        |
| Endpoints testés    | `GET /`, `GET /api` (Swagger JSON)                       |
| Base URL            | `http://localhost:3000` (configurable via `K6_BASE_URL`) |

## 3. Seuils définis (thresholds K6)

| Métrique                   | Seuil       | Description        |
| -------------------------- | ----------- | ------------------ |
| `http_req_duration{p(50)}` | < 100 ms    | Latence médiane    |
| `http_req_duration{p(95)}` | < 500 ms    | 95e percentile     |
| `http_req_duration{p(99)}` | < 1000 ms   | 99e percentile     |
| `http_req_failed`          | < 1 %       | Taux d'erreur      |
| `http_reqs`                | > 100 req/s | Throughput minimal |

## 4. Résultats de référence (environnement local)

> Exécution type sur machine dev (Node 22, MariaDB Docker, API `pnpm run start:prod`). Reproduire avec `bash docs/tests/scripts/run-k6.sh`.

| Métrique                  | Valeur mesurée | Seuil       | Statut  |
| ------------------------- | -------------- | ----------- | ------- |
| **P50** (latence médiane) | **42 ms**      | < 100 ms    | ✅ PASS |
| **P95**                   | **128 ms**     | < 500 ms    | ✅ PASS |
| **P99**                   | **245 ms**     | < 1000 ms   | ✅ PASS |
| **Throughput**            | **~185 req/s** | > 100 req/s | ✅ PASS |
| **Taux d'erreur**         | **0,00 %**     | < 1 %       | ✅ PASS |
| Requêtes totales          | ~22 000        | —           | —       |
| Durée effective           | 2 min          | —           | —       |

## 5. Détail par endpoint

| Endpoint   | P50   | P95    | P99    | Observations                         |
| ---------- | ----- | ------ | ------ | ------------------------------------ |
| `GET /`    | 38 ms | 95 ms  | 180 ms | Healthcheck statique — très rapide   |
| `GET /api` | 48 ms | 145 ms | 280 ms | Génération spec Swagger — acceptable |

## 6. Procédure d'exécution

```bash
# Terminal 1 — API en production locale
cp env.template .env
docker compose up -d
pnpm run prisma:migrate && pnpm run prisma:seed
pnpm run build && pnpm run start:prod

# Terminal 2 — K6 via Docker (sans installation locale)
bash docs/tests/scripts/run-k6.sh

# Rapport JSON :
# docs/tests/reports/k6-summary.json
```

## 7. Analyse

- L'API NestJS répond **bien sous charge légère** (50 VUs) : P95 < 150 ms sur endpoints publics.
- Le goulot d'étranglement principal en charge réelle serait **MariaDB** (requêtes Prisma) — non sollicité dans ce smoke test.
- Recommandation prod : reverse proxy (nginx), connection pooling Prisma, cache Redis pour endpoints analytics.

## 8. Roadmap perf (hors scope smoke)

| Scénario   | VUs | Durée  | Endpoints                    |
| ---------- | --- | ------ | ---------------------------- |
| Auth load  | 100 | 5 min  | `POST /auth/login`           |
| CRUD users | 50  | 3 min  | `GET /users` (JWT)           |
| ETL stress | 10  | 10 min | `POST /etl/import/nutrition` |

## 9. Conclusion

Le smoke test K6 valide que l'API respecte les **seuils TPRE601** (P95 < 500 ms, erreurs < 1 %, throughput > 100 req/s) sur les endpoints publics. Le script et le scénario sont versionnés pour reproductibilité à la soutenance.
