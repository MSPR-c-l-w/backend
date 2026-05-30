# Matrice de traçabilité — User Stories → cas de test → résultat

**Projet :** Backend API MSPR — TPRE601  
**Date :** 30 mai 2026

Légende résultat : ✅ PASS · ⚠️ PARTIEL · ❌ FAIL · 🔜 PRÉVU

---

## Sprint 1 — Fondations

| US / Issue | Description                | Cas de test                         | Fichier spec                   | Résultat   |
| ---------- | -------------------------- | ----------------------------------- | ------------------------------ | ---------- |
| #26        | Liste utilisateurs paginée | Pagination, filtre search, stats    | `users.service.spec.ts`        | ✅ PASS    |
| #26        | GET user by id             | Trouvé / NotFoundException          | `users.service.spec.ts`        | ✅ PASS    |
| Auth       | Register                   | Succès, email dupliqué              | `auth.service.spec.ts`         | ✅ PASS    |
| Auth       | Login                      | Succès, mauvais MDP, compte inactif | `auth.service.spec.ts`         | ✅ PASS    |
| Auth       | Refresh / Logout           | Token valide / révoqué              | `auth.service.spec.ts`         | ✅ PASS    |
| #31        | Auth 401 hotfix            | Login credentials invalides         | `auth.service.spec.ts`         | ✅ PASS    |
| Orga       | CRUD organization          | Soft delete, nom dupliqué           | `organization.service.spec.ts` | ✅ PASS    |
| #20        | User avec role + org       | Include relations                   | `users.service.spec.ts`        | ✅ PASS    |
| Roles      | RBAC seed                  | Rôles ADMIN, CLIENT, …              | `roles.service.spec.ts`        | ⚠️ PARTIEL |

## Sprint 2 — Domaine fitness & ETL

| US / Issue | Description             | Cas de test                   | Fichier spec                           | Résultat   |
| ---------- | ----------------------- | ----------------------------- | -------------------------------------- | ---------- |
| #17        | Pipeline ETL nutrition  | Import → staging PENDING      | `etl.service.spec.ts`                  | ✅ PASS    |
| #22        | Tables staging          | findPending, updateStatus     | `etl-staging.service.spec.ts`          | ✅ PASS    |
| #15        | Health profile cleaning | Pipeline staging              | `health-profile.service.spec.ts`       | ⚠️ PARTIEL |
| #13        | Session workout summary | getTodaySummary, getUserLevel | `session.service.spec.ts`              | ✅ PASS    |
| #25        | Exercice CRUD           | findByFilters, getById        | `exercice.service.spec.ts`             | ✅ PASS    |
| Nutrition  | CRUD + pagination       | getNutritions, update, delete | `nutrition.service.spec.ts`            | ✅ PASS    |
| #24        | Plans CRUD              | create, read, update, delete  | `plan.service.spec.ts`                 | ✅ PASS    |
| #6         | Subscription            | CRUD abonnements              | `subscription.service.spec.ts`         | ✅ PASS    |
| ETL        | WebSocket gateway       | Émission événements pipeline  | `etl.gateway.spec.ts`                  | ✅ PASS    |
| ETL        | Anomaly detector        | Détection anomalies JSON      | `etl-anomaly-detector.service.spec.ts` | ✅ PASS    |
| #9         | ETL websocket error fix | Reconnexion sans crash        | `etl.gateway.spec.ts`                  | ✅ PASS    |

## Sprint 3 — Social, analytics, IA, livraison TPRE601

| US / Issue | Description                | Cas de test                    | Fichier spec                 | Résultat  |
| ---------- | -------------------------- | ------------------------------ | ---------------------------- | --------- |
| #59 / #1   | Posts CRUD                 | deletePost RBAC (auteur/ADMIN) | `post.service.spec.ts`       | ✅ PASS   |
| #167       | Pagination cursor posts    | Cursor + author name           | `post.service.spec.ts`       | ✅ PASS   |
| #173       | Filtres catégorie / humeur | Filtres query params           | `post.controller.spec.ts`    | ✅ PASS   |
| #172       | PATCH /users/me            | Update prénom/nom              | `users.service.spec.ts`      | ✅ PASS   |
| #28 / #30  | Analytics dashboard        | Métriques API, logs            | `analytics.service.spec.ts`  | ✅ PASS   |
| Dashboard  | Pilotage admin             | KPIs agrégés                   | `dashboard.service.spec.ts`  | ✅ PASS   |
| #99        | AI workout generate        | Appel microservice, fallback   | `ai-workout.service.spec.ts` | ✅ PASS   |
| #101       | User AI preferences        | PUT preferences                | `users.service.spec.ts`      | ✅ PASS   |
| #105       | ERD / modèles IA           | Seed Prisma                    | `prisma.service.spec.ts`     | ✅ PASS   |
| E2E        | Healthcheck API            | GET / → 200                    | `app.e2e-spec.ts`            | ❌ FAIL\* |
| E2E        | Auth login e2e             | POST /auth/login               | —                            | 🔜 PRÉVU  |
| Perf       | Smoke load 50 VUs          | P95 < 500 ms                   | `perf/smoke.js`              | ✅ PASS   |
| Sécu       | Scan Trivy Docker          | 0 CRITICAL                     | `run-trivy.sh`               | ✅ PASS   |

\* Échec e2e documenté — prérequis `DATABASE_URL` + MariaDB ([RAPPORT_E2E.md](./RAPPORT_E2E.md)).

---

## Synthèse par type de test

| Type             | Total cas  | Pass | Fail | Prévu |
| ---------------- | ---------- | ---- | ---- | ----- |
| Unitaires (Jest) | 274        | 274  | 0    | —     |
| e2e (Supertest)  | 1          | 0    | 1    | 5+    |
| Performance (K6) | 1 scénario | 1    | 0    | 3     |
| Sécurité (Trivy) | 1 scan     | 1    | 0    | —     |

## Couverture traçabilité

| Sprint    | US référencées | Couvertes par tests unitaires | Taux       |
| --------- | -------------- | ----------------------------- | ---------- |
| S1        | 8              | 7                             | 87,5 %     |
| S2        | 10             | 9                             | 90 %       |
| S3        | 12             | 10                            | 83 %       |
| **Total** | **30**         | **26**                        | **86,7 %** |

Les 4 US partielles/prévues concernent principalement les tests e2e et la couverture roles/interceptors — voir [RAPPORT_COUVERTURE.md](./RAPPORT_COUVERTURE.md).
