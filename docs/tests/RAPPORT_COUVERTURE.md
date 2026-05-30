# Rapport de couverture Jest — TPRE601

**Commande :** `pnpm run test:cov`  
**Date :** 30 mai 2026  
**Environnement :** Windows 11, Node.js, pnpm  
**Rapport HTML :** [coverage-report/index.html](./coverage-report/index.html)

---

## 1. Synthèse d'exécution

| Indicateur    | Valeur                     |
| ------------- | -------------------------- |
| Suites        | 41 passed / 41 total       |
| Tests         | **274 passed** / 274 total |
| Durée         | ~13 s                      |
| Statut global | **PASS**                   |

## 2. Couverture globale

| Métrique       | Résultat    | Seuil TPRE601 | Statut              |
| -------------- | ----------- | ------------- | ------------------- |
| **Statements** | **70,29 %** | ≥ 80 %        | ❌ Écart −9,71 pts  |
| **Branches**   | **61,20 %** | ≥ 75 %        | ❌ Écart −13,80 pts |
| **Functions**  | **66,66 %** | ≥ 80 %        | ❌ Écart −13,34 pts |
| **Lines**      | **71,67 %** | ≥ 80 %        | ❌ Écart −8,33 pts  |

## 3. Modules les mieux couverts (≥ 90 %)

| Module                               | Statements | Branches | Functions |
| ------------------------------------ | ---------- | -------- | --------- |
| `auth/services/auth`                 | 95 %+      | 85 %+    | 100 %     |
| `users/services/users`               | 92,77 %    | 80,55 %  | 100 %     |
| `subscription/services/subscription` | 100 %      | 87,5 %   | 100 %     |
| `etl/services/etl-staging`           | 100 %      | 100 %    | 100 %     |
| `utils/constants`                    | 100 %      | 100 %    | 100 %     |

## 4. Modules sous-couverts (priorité remédiation)

| Module / fichier                 | Statements | Cause principale                            |
| -------------------------------- | ---------- | ------------------------------------------- |
| `main.ts`                        | 0 %        | Point d'entrée non testé (bootstrap)        |
| `app.module.ts`                  | 0 %        | Assemblage modules — couvert par build      |
| `ai/workout-microservice.client` | ~40 %      | Branches erreur réseau / timeout            |
| `etl/services/etl`               | ~55 %      | Pipelines Kaggle (HttpService mock partiel) |
| `analytics/interceptors`         | ~50 %      | Interceptor HTTP non couvert                |
| `utils/security/password`        | 66 %       | Hash/compare — chemins edge case            |
| `health-profile/services`        | ~70 %      | Import pipeline ETL                         |

## 5. Plan de remédiation (objectif ≥ 80 %)

| Priorité | Action                                                                           | Impact estimé   |
| -------- | -------------------------------------------------------------------------------- | --------------- |
| P1       | Tests `AuthService` — branches refresh expiré, email verification                | +3 % branches   |
| P1       | Tests `EtlService` — mock HttpService complet (nutrition + exercice)             | +5 % statements |
| P2       | Tests `AiWorkoutService` + client microservice — erreurs 503/timeout             | +4 % branches   |
| P2       | Tests interceptors analytics (`ApiMetricsInterceptor`)                           | +2 % statements |
| P3       | Exclure `main.ts` du collectCoverageFrom (bootstrap) ou test d'intégration léger | +1 % global     |
| P3       | Tests `HealthProfileService.runHealthProfilePipeline`                            | +3 % statements |

## 6. Configuration Jest

```json
// package.json — section jest
{
  "collectCoverageFrom": ["**/*.(t|j)s"],
  "coverageDirectory": "../coverage",
  "coverageReporters": ["text", "lcov", "html", "json-summary"]
}
```

Le rapport HTML est généré dans `coverage/lcov-report/` puis archivé dans `docs/tests/coverage-report/`.

## 7. CI GitHub Actions

Le workflow [`.github/workflows/ci-test.yml`](../../.github/workflows/ci-test.yml) exécute `pnpm run test:cov` sur chaque PR. L'artefact `coverage-report` est uploadé (PR uniquement).

**Note :** les seuils `coverageThreshold` ne sont pas encore configurés dans Jest — recommandation : activer après remédiation P1/P2 pour éviter les échecs CI prématurés.

## 8. Conclusion

Les **274 tests unitaires passent** et couvrent l'ensemble des modules métier. La couverture globale (**70,29 % statements**) reste **sous le seuil TPRE601 de 80 %** ; les écarts sont documentés avec un plan de remédiation priorisé. Le rapport HTML interactif permet d'identifier fichier par fichier les lignes non couvertes.
