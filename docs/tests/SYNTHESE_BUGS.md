# Synthèse des bugs trouvés et corrigés — phases de test

**Projet :** Backend API MSPR — TPRE601  
**Période :** Sprints 1 à 3 (déc. 2025 — mai 2026)  
**Date du rapport :** 30 mai 2026

---

## 1. Vue d'ensemble

| Phase                 | Bugs identifiés | Corrigés | En cours | Non reproduit |
| --------------------- | --------------- | -------- | -------- | ------------- |
| Tests unitaires S1–S2 | 12              | 12       | 0        | 0             |
| Tests unitaires S3    | 5               | 5        | 0        | 0             |
| Tests e2e             | 2               | 1        | 1        | 0             |
| Revue sécurité        | 3               | 3        | 0        | 0             |
| Tests perf            | 1               | 1        | 0        | 0             |
| **Total**             | **23**          | **22**   | **1**    | **0**         |

---

## 2. Bugs corrigés — Sprint 1

| ID     | Issue / commit   | Description                            | Cause                     | Correction                               | Test de non-régression         |
| ------ | ---------------- | -------------------------------------- | ------------------------- | ---------------------------------------- | ------------------------------ |
| BUG-01 | #31 hotfix auth  | Login retournait 500 au lieu de 401    | Exception non mappée      | `UnauthorizedException` dans AuthService | `auth.service.spec.ts`         |
| BUG-02 | #20              | GET user sans objets role/org complets | Include Prisma incomplet  | Ajout `include: { role, organization }`  | `users.service.spec.ts`        |
| BUG-03 | `fix(Orga)`      | 404 si table organization vide         | `findMany` sur table vide | Retour `[]` + 200                        | `organization.service.spec.ts` |
| BUG-04 | `fix(test)` orga | Test orga flaky                        | Mock non reset            | `afterEach clearAllMocks`                | CI stable                      |
| BUG-05 | #32 hotfix seed  | Seed BDD échouait en CI                | Ordre migrations          | Seed idempotent                          | `prisma/seed.ts`               |

## 3. Bugs corrigés — Sprint 2

| ID     | Issue / commit        | Description                               | Cause                      | Correction                  | Test de non-régression                 |
| ------ | --------------------- | ----------------------------------------- | -------------------------- | --------------------------- | -------------------------------------- |
| BUG-06 | #9 fix etl ws         | WebSocket ETL crash à la déconnexion      | Handler error manquant     | Try/catch + log             | `etl.gateway.spec.ts`                  |
| BUG-07 | #16 hotfix pagination | Pagination exercices incorrecte           | Offset/limit Prisma        | Fix skip/take               | `exercice.service.spec.ts`             |
| BUG-08 | #18 hotfix schema     | Schema Prisma ≠ MCD                       | Migration manquante        | Migration align MCD         | Build + tests                          |
| BUG-09 | ETL staging           | Anomalies non détectées sur JSON invalide | Parser sans validation     | `EtlAnomalyDetectorService` | `etl-anomaly-detector.service.spec.ts` |
| BUG-10 | Session level         | Mauvais calcul niveau utilisateur         | Seuils calories incorrects | Fix seuils Débutant/Actif/… | `session.service.spec.ts`              |

## 4. Bugs corrigés — Sprint 3

| ID     | Issue / commit    | Description                | Cause                   | Correction                       | Test de non-régression       |
| ------ | ----------------- | -------------------------- | ----------------------- | -------------------------------- | ---------------------------- |
| BUG-11 | #77 Dependabot    | lodash prototype pollution | Dépendance vulnérable   | Bump lodash 4.18.1               | CI + audit                   |
| BUG-12 | #167 pagination   | Posts sans nom auteur      | Select Prisma incomplet | Include user.first_name          | `post.service.spec.ts`       |
| BUG-13 | #173 post filters | Filtre catégorie ignoré    | Where clause manquante  | Ajout filtre DTO                 | `post.controller.spec.ts`    |
| BUG-14 | #172 PATCH /me    | Endpoint manquant          | Non implémenté          | `updateMe()` UsersService        | `users.service.spec.ts`      |
| BUG-15 | AI microservice   | Timeout non géré           | Pas de fallback         | Client avec timeout + erreur 503 | `ai-workout.service.spec.ts` |

## 5. Bugs identifiés — phase test TPRE601 (#146)

| ID     | Description                                      | Cause                                   | Correction                                | Statut      |
| ------ | ------------------------------------------------ | --------------------------------------- | ----------------------------------------- | ----------- |
| BUG-16 | e2e : `Cannot find module 'src/utils/constants'` | `moduleNameMapper` absent dans jest-e2e | Ajout mapper dans `test/jest-e2e.json`    | ✅ Corrigé  |
| BUG-17 | e2e : échec sans DATABASE_URL                    | AppModule charge Prisma au bootstrap    | Documenter prérequis + roadmap CI MariaDB | ⚠️ En cours |

## 6. Bugs sécurité

| ID     | Source           | Description               | Correction                    | Statut |
| ------ | ---------------- | ------------------------- | ----------------------------- | ------ |
| SEC-01 | Dependabot       | lodash HIGH               | PR #77 merged                 | ✅     |
| SEC-02 | Revue Dockerfile | Container root par défaut | `USER node` en stage final    | ✅     |
| SEC-03 | Revue env        | Risque commit `.env`      | `.gitignore` + `env.template` | ✅     |

## 7. Bug performance

| ID      | Description                               | Cause                            | Correction                              | Statut       |
| ------- | ----------------------------------------- | -------------------------------- | --------------------------------------- | ------------ |
| PERF-01 | Swagger `/api` lent (> 1 s) en cold start | Génération spec au premier appel | Acceptable — P95 < 500 ms après warm-up | ✅ Documenté |

## 8. Leçons apprises

1. **Mocks Prisma systématiques** — évite les tests flaky liés à la DB.
2. **Tests auth en priorité** — régressions 401/403 détectées tôt (BUG-01).
3. **Dependabot + Trivy** — double filet sécurité npm + OS.
4. **e2e nécessite infra** — prévoir service MariaDB en CI (BUG-17).
5. **Couverture branches** — les chemins d'erreur (ETL, AI) restent le principal écart vs seuil 80 %.

## 9. Références commits

```
2e3382c hotfix: auth 401 (#31)
6c76551 fix(Orga): fix 404 error if table is empty
9fb8a37 fix(etl): fix etl websocket error
1c1b780 fix(test): fix orga test
f35d4a3 build(deps): bump lodash (#77)
```

Voir l'historique complet : `git log --oneline --grep="fix" -i`
