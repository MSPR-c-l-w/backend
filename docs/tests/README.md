# Plan de tests et rapports d'exécution — TPRE601

Livrables de l'issue [#146](https://github.com/MSPR-c-l-w/backend/issues/146) (EPIC [#120](https://github.com/MSPR-c-l-w/backend/issues/120)).

**Date de génération :** 30 mai 2026  
**Branche :** `146-plan-de-tests-et-rapports-dexécution-tpre601`  
**Commit de référence :** `main` rebased (post #173)

---

## Index des livrables

| Document                                                   | Description                                               |
| ---------------------------------------------------------- | --------------------------------------------------------- |
| [PLAN_DE_TESTS.md](./PLAN_DE_TESTS.md)                     | Périmètre, stratégie par couche, critères d'entrée/sortie |
| [RAPPORT_COUVERTURE.md](./RAPPORT_COUVERTURE.md)           | Résultats `pnpm run test:cov` et analyse des écarts       |
| [RAPPORT_E2E.md](./RAPPORT_E2E.md)                         | Exécution Supertest — résultats pass/fail                 |
| [RAPPORT_TRIVY.md](./RAPPORT_TRIVY.md)                     | Scan sécurité image Docker (CVE)                          |
| [RAPPORT_PERFORMANCE.md](./RAPPORT_PERFORMANCE.md)         | Tests de charge K6 — P50/P95/P99, throughput, erreurs     |
| [MATRICE_TRACABILITE.md](./MATRICE_TRACABILITE.md)         | User Stories → cas de test → résultat                     |
| [SYNTHESE_BUGS.md](./SYNTHESE_BUGS.md)                     | Bugs identifiés et corrigés durant les phases de test     |
| [coverage-report/index.html](./coverage-report/index.html) | Rapport HTML Jest (couverture de code)                    |

## Scripts reproductibles

| Script                                         | Usage                                |
| ---------------------------------------------- | ------------------------------------ |
| [scripts/run-trivy.sh](./scripts/run-trivy.sh) | Scan Trivy de l'image Docker backend |
| [scripts/run-k6.sh](./scripts/run-k6.sh)       | Test de charge K6 sur l'API          |
| [perf/smoke.js](./perf/smoke.js)               | Scénario K6 — endpoints publics      |

## Commandes rapides

```bash
# Couverture unitaire + rapport HTML
pnpm run test:cov
# Rapport HTML : coverage/lcov-report/index.html (copié dans docs/tests/coverage-report/)

# Tests e2e (requiert DATABASE_URL + MariaDB)
cp env.template .env
docker compose up -d
pnpm run test:e2e

# Scan sécurité Docker
bash docs/tests/scripts/run-trivy.sh

# Test de performance
pnpm run start:prod &
bash docs/tests/scripts/run-k6.sh
```

## Seuils cibles (TPRE601)

| Métrique   | Seuil  | Statut actuel             |
| ---------- | ------ | ------------------------- |
| Statements | ≥ 80 % | 70,29 % — écart documenté |
| Branches   | ≥ 75 % | 61,20 % — écart documenté |
| Functions  | ≥ 80 % | 66,66 % — écart documenté |
| Lines      | ≥ 80 % | 71,67 % — écart documenté |

Voir [RAPPORT_COUVERTURE.md](./RAPPORT_COUVERTURE.md) pour le plan de remédiation.
