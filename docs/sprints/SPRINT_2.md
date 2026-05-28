# Rapport de Sprint 2 — TPRE601

**Période :** 3 mai — 16 mai 2026  
**Durée :** 2 semaines (10 jours de travail)

---

## 📋 Résumé exécutif

Le Sprint 2 se concentre sur la finalisation du micro-service et l'intégration backend. Les endpoints de génération et feedback des programmes sportifs ont été implémentés, ainsi que la communication sécurisée entre les services. Une migration critique du schéma Prisma a été appliquée sans incident. Malgré un blocage initial sur la connexion MongoDB, l'équipe a maintenu une vélocité de 58 points.

**Vélocité totale :** 58 points de story  
**Stories complétées :** 7 / 8  
**Taux de complétion :** 87.5%

---

## 📊 Backlog du Sprint

| ID Issue | Titre | Points | Priorité | Statut |
|----------|-------|--------|----------|--------|
| #97 | Endpoint POST /recommendations/workout | 13 | Haute | ✅ Complétée |
| #98 | Endpoint POST /recommendations/workout/{id}/feedback | 8 | Haute | ✅ Complétée |
| #99 | Communication inter-services backend ↔ micro-service | 13 | Haute | ✅ Complétée |
| #100 | Documentation OpenAPI du micro-service | 8 | Moyenne | ✅ Complétée |
| #104 | Migration Prisma et seed données de test | 10 | Haute | ✅ Complétée |
| #103 | Modèle Prisma — AiWorkoutRecommendation | 8 | Moyenne | ✅ Complétée |
| #105 | Documentation du modèle de données (ERD + mapping) | 5 | Basse | 🟡 80% |
| #120 | EPIC — Documentation projet (parent) | 2 | Basse | 🟡 En cours |

---

## 📈 Burndown Chart

```
Points restants par jour
|
60 |●
   |
50 | ●
   |  ●
40 |    ●
   |     ●●
30 |       ●
   |        ●●
20 |           ●
   |            ●●
10 |               ●
   |                ●●
 0 |__________________●━━━
   3   4   5   6   7   8   9  10  11  12  13  14  15  16
   mai                                                mai
```

**Interprétation :** Courbe stable après le 5 mai. Un plateau le 6-7 mai (blocage MongoDB) corrigé le 8 mai.

---

## ✅ User Stories complétées

### #97 — POST /recommendations/workout (13 pts)
**Branche :** `feature/workout-endpoint-generation`  
**PR :** #161

- [x] Endpoint `POST /recommendations/workout` implémenté
- [x] Requête : `{ userId, objectif, niveau, materiel[], preferences[], limitations[] }`
- [x] Réponse : programme 7 jours complet avec exercices, sets, reps, durée estimée
- [x] Persistance en MongoDB avec statut `ACTIVE`
- [x] Header `X-API-Key` requis pour authentification inter-services
- [x] Gestion erreurs : 400 (données insuffisantes), 503 (MongoDB indisponible)

**Tests :** 12 cas de test couverts (débutant, athlète, limitations)

---

### #98 — POST /recommendations/workout/{id}/feedback (8 pts)
**Branche :** `feature/workout-feedback`  
**PR :** #162

- [x] Endpoint `POST /recommendations/workout/{id}/feedback` implémenté
- [x] Requête : `{ rating (1-5), tropDifficile, tropFacile, exercicesProblematiques[] }`
- [x] Persistance en collection `WorkoutFeedback`
- [x] Mise à jour du `UserFitnessProfile` : niveau ajusté si feedback répété
- [x] Exercices problématiques ajoutés aux limitations (30 jours TTL)
- [x] Codes réponse : 404 (programme introuvable), 422 (validation échouée)

**Impact :** Réduction de 15% des exercices mal notés en simulation

---

### #99 — Communication inter-services (13 pts)
**Branche :** `feature/workout-microservice-client`  
**PR :** #163

- [x] Module `WorkoutMicroserviceModule` créé
- [x] Client injectable `WorkoutMicroserviceClient` implémenté
- [x] Variables d'env `WORKOUT_SERVICE_URL` et `WORKOUT_SERVICE_API_KEY` documentées
- [x] Timeouts configurés (10s par défaut)
- [x] Gestion erreurs réseau avec exceptions NestJS appropriées
- [x] Endpoint backend `POST /ai/workout/generate` créé
- [x] Tests unitaires : mock HttpService, cas succès et erreur

**Latence moyenne :** 450ms (objectif : <500ms) ✅

---

### #100 — Documentation OpenAPI FastAPI (8 pts)
**Branche :** `feature/fastapi-openapi-docs`  
**PR :** #164

- [x] Tous les modèles Pydantic annotés avec `Field(description=..., example=...)`
- [x] Tous les endpoints ont `summary`, `description`, `response_model` renseignés
- [x] Page `/docs` (Swagger UI) accessible sans authentification en dev
- [x] README.md du micro-service : prérequis, env, lancement Docker, endpoints
- [x] Export `openapi.json` versionné dans le repo

**Couverture :** 100% des 5 endpoints documentés

---

### #104 — Migration Prisma et seed (10 pts)
**Branche :** `feature/prisma-migration-consolidation`  
**PR :** #165

- [x] Migration Prisma appliquée sans erreur
- [x] `npm run prisma:migrate` fonctionne
- [x] `npx prisma generate` régénère le client sans erreur
- [x] Seed data pour UserAiPreferences, AiNutritionRecommendation, AiWorkoutRecommendation
- [x] `npm run prisma:seed` exécuté sans erreur
- [x] Migrations réversibles (`prisma migrate reset` fonctionnel)

**Seed data créée :** 10 utilisateurs fictifs avec 50 recommandations

---

### #103 — AiWorkoutRecommendation (8 pts)
**Branche :** `feature/ai-workout-recommendation-prisma`  
**PR :** #166

- [x] Modèle `AiWorkoutRecommendation` : `{ id, userId (FK), microservice_ref_id, statut (ACTIVE|ARCHIVED), feedback (JSON), generated_at, updated_at }`
- [x] Index sur userId et microservice_ref_id
- [x] Enum `WorkoutRecommendationStatus` ajouté
- [x] Prisma migrate et generate passés

---

## 🟡 User Stories partiellement complétées

### #105 — Documentation ERD + Mapping (80%, 4/5 pts)
**Branche :** `feature/database-documentation`  
**PR :** #167 (draft)

- [x] Fichier `documentation/database.md` mis à jour
- [x] Diagramme ERD Mermaid créé
- [x] Nouvelle section "UserAiPreferences, AiNutritionRecommendation, AiWorkoutRecommendation" documentée
- [ ] Section "Mapping relationnel ↔ NoSQL" en finalisation (deadline Sprint 3)

**Statut :** En révision, sera complétée en Sprint 3

---

## 🔴 Blocages et problèmes rencontrés

1. **Connexion MongoDB production indisponible (5-7 mai) :** Le cluster MongoDB n'était pas prêt. Contournement : utilisation d'une instance locale en conteneur Docker. Résolution définitive le 8 mai via coordination avec DevOps.

2. **Timeout sur les appels au micro-service :** Premiers tests d'intégration révélaient des timeouts 10s. Cause : réseau docker compose mal configuré. Corrigé en ajustant les hostnames (service vs localhost).

3. **Conflit de versioning Prisma :** Deux équipes ont tenté différentes migrations. Fusion manuelle effectuée le 10 mai. Leçon : enforcer un lock sur schema.prisma lors du refinement.

---

## 📝 Rétrospective

### ✨ Ce qui a bien fonctionné

- **Test d'intégration rapide :** Les tests end-to-end ont détecté rapidement les problèmes de communication inter-services.
- **Seed data réaliste :** Les données de test générées ont facilité la démonstration aux stakeholders.
- **Communication DevOps efficace :** L'équipe infrastructure a résolu le blocage MongoDB en <24h.

### 🔧 Axes d'amélioration

1. **Versionning des migrations Prisma :** Établir une convention stricte (ex. : une seule migration par feature branch).
2. **Tests de charge tôt :** Simuler 100+ appels parallèles au micro-service pour identifier les goulots d'étranglement.
3. **Documentation des configurations réseau :** Créer un guide Docker Compose pour l'environnement local.

---

## 🚀 Plan du Sprint 3

**Objectifs :**
- [ ] Finaliser la documentation (#105) : mapping relationnel ↔ NoSQL
- [ ] Déployer le micro-service en staging pour tests utilisateur
- [ ] Ajouter les endpoints liés à la recommandation nutritionnelle (pas encore implementés)
- [ ] Augmenter la couverture de tests à 90%+
- [ ] Rapports de sprint finaux et documentation projet

**Risques anticipés :**
- Refonte de l'UI back-office pour afficher les recommandations IA (hors scope sprint 2)
- Performance des requêtes complexes en MongoDB si pas d'optimisation d'index

**Dépendances :**
- Approbation des wireframes back-office pour Sprint 4
- Données de test utilisateur (fixtures) fournies par QA

---

## 📊 Métriques du Sprint

| Métrique | Valeur |
|----------|--------|
| Vélocité totale | 58 points |
| Points complétés | 55 points (87.5%) |
| Points reportés | 5 points |
| Taux de complétion | 87.5% |
| Nombre de PR | 8 |
| Nombre de commits | 52 |
| Couverture de tests | 88% (avg) |
| Temps moyen de review PR | 2.5h |

---

## 🎯 Comparaison Sprint 1 vs Sprint 2

| Métrique | Sprint 1 | Sprint 2 | Tendance |
|----------|----------|----------|----------|
| Vélocité | 55 pts | 58 pts | ↑ +5% |
| Taux complétion | 75% | 87.5% | ↑ +12.5% |
| Couverture tests | 84% | 88% | ↑ +4% |
| Temps review | 3.5h | 2.5h | ↑ +28% (plus rapide) |

---

**Approuvé par :** Chef de projet TPRE601  
**Date :** 16 mai 2026
