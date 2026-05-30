# Plan de tests — Backend API TPRE601

## 1. Objectif

Valider la qualité, la sécurité et les performances du backend NestJS (fitness & santé) avant livraison TPRE601. Ce plan couvre les tests **unitaires**, **d'intégration** (via mocks) et **e2e**, ainsi que les contrôles **sécurité** (Trivy) et **performance** (K6).

## 2. Périmètre

### 2.1 Inclus

| Domaine             | Modules                                                                  | Type de test           |
| ------------------- | ------------------------------------------------------------------------ | ---------------------- |
| Authentification    | `auth`                                                                   | Unit + e2e (prévu)     |
| Utilisateurs & RBAC | `users`, `roles`                                                         | Unit                   |
| Multi-tenant        | `organization`                                                           | Unit                   |
| Santé & fitness     | `health-profile`, `nutrition`, `exercice`, `session`, `session-exercise` | Unit                   |
| Abonnements         | `plan`, `subscription`                                                   | Unit                   |
| Social              | `post`                                                                   | Unit                   |
| Administration      | `dashboard`, `analytics`                                                 | Unit                   |
| ETL                 | `etl` (staging, pipelines, WebSocket)                                    | Unit                   |
| IA                  | `ai` (workout microservice)                                              | Unit                   |
| Infrastructure      | `prisma`, `app`                                                          | Unit + e2e healthcheck |
| Conteneurisation    | `Dockerfile`                                                             | Trivy (CVE)            |
| API REST            | Endpoints Swagger                                                        | K6 (charge)            |

### 2.2 Exclus

- Tests du frontend / back-office Next.js (hors dépôt backend)
- Tests manuels de l'interface Swagger (hors scope automatisé)
- Tests de charge sur les pipelines ETL Kaggle (dépendance réseau externe)
- Penetration testing / audit OWASP complet (hors périmètre MSPR)

## 3. Stratégie par couche

### 3.1 Tests unitaires (Jest)

- **Framework :** Jest v30 + ts-jest
- **Emplacement :** `src/**/*.spec.ts` (41 suites, 274 tests)
- **Règle :** aucun appel réseau ou base réelle — `PrismaService` et `HttpService` mockés
- **Exécution :** `pnpm run test` / `pnpm run test:cov`
- **CI :** workflow `.github/workflows/ci-test.yml`

**Modules couverts :**

- Controllers : délégation au service, codes HTTP, guards
- Services : logique métier, exceptions (`NotFoundException`, `ForbiddenException`, …)
- ETL : détection d'anomalies, staging PENDING/APPROVED/REJECTED
- Auth : register, login, refresh, logout, reset password

### 3.2 Tests d'intégration

Dans ce projet, l'intégration est assurée par :

1. **Tests unitaires avec mocks Prisma/Http** — valident l'assemblage controller → service sans I/O
2. **Module specs** — ex. `etl.module.spec.ts` vérifie le câblage NestJS
3. **CI build** — `pnpm run build` compile l'ensemble des modules (`.github/workflows/ci-build.yml`)

Pas de suite dédiée `@nestjs/testing` + base H2 : MariaDB via Prisma rend ce pattern coûteux ; les e2e Supertest compensent.

### 3.3 Tests end-to-end (Supertest)

- **Framework :** Supertest v7 + Jest (`test/jest-e2e.json`)
- **Emplacement :** `test/app.e2e-spec.ts`
- **Prérequis :** `DATABASE_URL` configuré, MariaDB démarrée (`docker compose up -d`)
- **Exécution :** `pnpm run test:e2e`
- **Objectif cible :** parcours auth (login, refresh), CRUD utilisateur, healthcheck

### 3.4 Tests de sécurité (Trivy)

- **Cible :** image Docker multi-stage (`Dockerfile`, base `node:24-alpine`)
- **Outil :** [Trivy](https://trivy.dev/) (scan OS + dépendances)
- **Script :** `docs/tests/scripts/run-trivy.sh`
- **Critère :** aucune CVE **CRITICAL** non traitée ; HIGH documentées avec plan

### 3.5 Tests de performance (K6)

- **Outil :** [Grafana k6](https://k6.io/)
- **Scénario :** `docs/tests/perf/smoke.js` — 50 VUs, 2 min, endpoints publics
- **Métriques :** P50/P95/P99, throughput (req/s), taux d'erreur (< 1 %)
- **Script :** `docs/tests/scripts/run-k6.sh`

## 4. Critères d'entrée (Entry criteria)

| #   | Critère                                | Vérification                       |
| --- | -------------------------------------- | ---------------------------------- |
| E1  | Code mergé sur la branche de livraison | Git                                |
| E2  | `pnpm install` sans erreur             | CI                                 |
| E3  | `pnpm run prisma:generate` OK          | CI build                           |
| E4  | Lint et format OK                      | `pnpm run lint && pnpm run format` |
| E5  | Build TypeScript OK                    | `pnpm run build`                   |
| E6  | Variables d'env documentées            | `env.template`                     |
| E7  | MariaDB disponible (e2e / perf)        | `docker compose up -d`             |

## 5. Critères de sortie (Exit criteria)

| #   | Critère               | Seuil                | Rapport                                            |
| --- | --------------------- | -------------------- | -------------------------------------------------- |
| S1  | Tests unitaires       | 100 % pass           | [RAPPORT_COUVERTURE.md](./RAPPORT_COUVERTURE.md)   |
| S2  | Couverture statements | ≥ 80 %               | [RAPPORT_COUVERTURE.md](./RAPPORT_COUVERTURE.md)   |
| S3  | Couverture branches   | ≥ 75 %               | [RAPPORT_COUVERTURE.md](./RAPPORT_COUVERTURE.md)   |
| S4  | Couverture functions  | ≥ 80 %               | [RAPPORT_COUVERTURE.md](./RAPPORT_COUVERTURE.md)   |
| S5  | Tests e2e             | 100 % pass (avec DB) | [RAPPORT_E2E.md](./RAPPORT_E2E.md)                 |
| S6  | CVE Trivy CRITICAL    | 0 non traitée        | [RAPPORT_TRIVY.md](./RAPPORT_TRIVY.md)             |
| S7  | Perf P95              | < 500 ms (smoke)     | [RAPPORT_PERFORMANCE.md](./RAPPORT_PERFORMANCE.md) |
| S8  | Taux d'erreur perf    | < 1 %                | [RAPPORT_PERFORMANCE.md](./RAPPORT_PERFORMANCE.md) |
| S9  | Traçabilité US        | Matrice complète     | [MATRICE_TRACABILITE.md](./MATRICE_TRACABILITE.md) |
| S10 | Bugs documentés       | Synthèse à jour      | [SYNTHESE_BUGS.md](./SYNTHESE_BUGS.md)             |

## 6. Environnements

| Environnement     | Usage                                       | Base de données            |
| ----------------- | ------------------------------------------- | -------------------------- |
| Local dev         | Développement, exécution manuelle des tests | MariaDB Docker (port 3306) |
| CI GitHub Actions | Lint, build, tests unitaires + couverture   | Sans DB (mocks)            |
| CI (e2e prévu)    | Supertest avec service MariaDB              | Service container          |
| Prod (Docker)     | Scan Trivy, tests perf smoke                | MariaDB externe            |

## 7. Planning d'exécution

| Phase   | Sprint | Activités                                                      |
| ------- | ------ | -------------------------------------------------------------- |
| Phase 1 | S1     | Tests unitaires auth, users, organization                      |
| Phase 2 | S2     | Tests ETL, nutrition, exercice, session                        |
| Phase 3 | S3     | Tests post, analytics, dashboard, ai — rapports finaux TPRE601 |

## 8. Responsabilités

| Rôle           | Responsabilité                                              |
| -------------- | ----------------------------------------------------------- |
| Développeur    | Écrire/maintainer les `*.spec.ts`, corriger les régressions |
| CI             | Exécuter lint, build, test:cov à chaque PR                  |
| Lead technique | Valider les rapports TPRE601 dans `docs/tests/`             |

## 9. Références

- Guide développeur : [`documentation/testing.md`](../../documentation/testing.md)
- Issue GitHub : [#146](https://github.com/MSPR-c-l-w/backend/issues/146)
- CI tests : [`.github/workflows/ci-test.yml`](../../.github/workflows/ci-test.yml)
