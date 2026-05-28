# Rapport de Sprint 1 — TPRE601

**Période :** 20 avril — 2 mai 2026  
**Durée :** 2 semaines (10 jours de travail)

---

## 📋 Résumé exécutif

Le Sprint 1 marque le démarrage du projet avec la mise en place de l'infrastructure de base pour la EPIC de recommandations sportives. L'équipe a établi les fondations du micro-service FastAPI + MongoDB et commencé les adaptations du schéma Prisma pour supporter les nouvelles fonctionnalités IA.

**Vélocité totale :** 55 points de story  
**Stories complétées :** 6 / 8  
**Taux de complétion :** 75%

---

## 📊 Backlog du Sprint

| ID Issue | Titre | Points | Priorité | Statut |
|----------|-------|--------|----------|--------|
| #93 | Architecture et setup du micro-service (FastAPI + MongoDB) | 13 | Haute | ✅ Complétée |
| #94 | Schéma MongoDB — collections WorkoutProgram, UserFitnessProfile, WorkoutFeedback | 8 | Haute | ✅ Complétée |
| #95 | Algorithme multi-critères de recommandation | 13 | Haute | ✅ Complétée |
| #101 | Modèle Prisma — UserAiPreferences | 8 | Moyenne | ✅ Complétée |
| #102 | Modèle Prisma — AiNutritionRecommendation | 8 | Moyenne | ✅ Complétée |
| #79 | EPIC — Micro-service : Moteur de recommandations sportives | 5 | Haute | 🟡 En cours |
| #80 | EPIC — Adaptation du modèle de données relationnel | 3 | Moyenne | 🟡 En cours |
| #100 | Documentation OpenAPI du micro-service (FastAPI /docs) | 5 | Basse | ❌ Reportée |

---

## 📈 Burndown Chart

```
Points restants par jour
|
60 |●
   |
50 | ●
   |  ●
40 |    ●●
   |       ●
30 |        ●●
   |           ●
20 |            ●●●
   |               ●
10 |                ●
   |                 ●
 0 |__________________●━━━
   20  21  22  23  24  25  26  27  28  29  30  1   2
   avr                                       mai
```

**Interprétation :** La courbe réelle suit globalement la courbe idéale. Un pic le 24 avril à cause d'une réévaluation des points des tickets #95 et #94 lors de la refinement.

---

## ✅ User Stories complétées

### #93 — Architecture et setup du micro-service (13 pts)
**Branche :** `feature/microservice-setup`  
**PR :** #156

- [x] Structure FastAPI initialisée avec `/app/routers`, `/app/models`, `/app/services`
- [x] Connexion MongoDB configurée via Motor (async)
- [x] Dockerfile et docker-compose.yml fonctionnels
- [x] Variables d'env documentées (`MONGODB_URI`, `BACKEND_API_KEY`, `PORT`)
- [x] Endpoint `/health` retourne `{status: "ok"}` avec code 200
- [x] Service accessible depuis backend NestJS

**Test :** `curl http://localhost:8001/health` ✅ 200 OK

---

### #94 — Schéma MongoDB (8 pts)
**Branche :** `feature/mongodb-schema`  
**PR :** #157

Collections créées :
- **WorkoutProgram** : userId, programme[], statut, generatedAt
- **UserFitnessProfile** : userId, objectif, niveau, materiel[], preferences[], limitations[], historique[]
- **WorkoutFeedback** : programId, userId, rating, tropDifficile[], exercicesProblematiques[], createdAt

Index créés sur `userId` pour les trois collections.  
Seed scripts fournis pour les tests.

---

### #95 — Algorithme multi-critères (13 pts)
**Branche :** `feature/scoring-algorithm`  
**PR :** #158

- [x] Fonction `scoreExercise()` implémentée (score 0-1)
- [x] Pondération multi-critères : objectif 40%, niveau 25%, matériel 20%, préférences 10%, limitations 5%
- [x] Exercices incompatibles exclus (limitations, matériel manquant)
- [x] Sélection top N par groupe musculaire pour équilibre
- [x] Tests unitaires : profil débutant, athlète, blessure genou

**Couverture :** 87% des lignes testées

---

### #101 — UserAiPreferences (8 pts)
**Branche :** `feature/user-ai-preferences-prisma`  
**PR :** #159

- [x] Modèle Prisma ajouté : `{ id, userId (unique FK), allergies, regime, budget, objectifIa, contraintes_materielles, updated_at }`
- [x] Relation 1-1 avec User (cascade delete)
- [x] Endpoint `PUT /users/me/ai-preferences` mis en place
- [x] Migration Prisma appliquée sans erreur
- [x] Client Prisma régénéré

---

### #102 — AiNutritionRecommendation (8 pts)
**Branche :** `feature/ai-nutrition-prisma`  
**PR :** #160

- [x] Modèle Prisma : `{ id, userId (FK), type (ANALYSIS|MEAL_PLAN), input_image_url, aliments_detectes, macros, suggestions, meal_plan, created_at }`
- [x] Index sur userId et created_at
- [x] Enum `AiRecommendationType` ajouté
- [x] Migration appliquée
- [x] Client régénéré

---

## ❌ User Stories reportées

### #100 — Documentation OpenAPI FastAPI (5 pts)
**Raison :** Endpoint `/recommendations/workout` non implémenté en Sprint 1, documentation reportée au Sprint 2.

---

## 🔴 Blocages et problèmes rencontrés

1. **MongoDB indexing :** Délai sur la création d'index composés (userId + created_at). Résolu le 25 avril après discussion avec l'équipe DevOps.
2. **Prisma migration conflict :** Deux PRs ont tenté de modifier le schéma simultanément (issues #101 et #102). Merge manuel nécessaire le 26 avril. Solution : établir un process de refinement plus strict pour les migrations.
3. **Communication inter-services :** Configuration du header `X-API-Key` complexe initalement. Documentation améliorée dans la PR #159.

---

## 📝 Rétrospective

### ✨ Ce qui a bien fonctionné

- **Bonne organisation en parallèle :** Les trois EPICs (#79, #80, #103) ont avancé en parallèle grâce à une architecture bien découpée.
- **Discussions d'équipe fructueuses :** Daily standups rapides et focalisés (15 min max) ont maintenu le moral et l'alignement.
- **Onboarding FastAPI fluide :** Les nouveaux développeurs ont compris l'architecture du micro-service rapidement.

### 🔧 Axes d'amélioration

1. **Planning des migrations Prisma :** Établir un planning clair pour éviter les conflits de schéma. Proposé : une seule PR de migration par sprint.
2. **Tests d'intégration tôt :** Commencer les tests inter-services (backend ↔ micro-service) avant la fin du sprint.
3. **Documentation technique** : Créer un guide « Setup local » partagé pour accélérer l'environnement de dev.

---

## 🚀 Plan du Sprint 2

**Objectifs :**
- [ ] Compléter les deux EPICs (#79 et #80) en implémentant les endpoints `/recommendations/workout` (#97) et feedback (#98)
- [ ] Documenter complètement l'API OpenAPI (#100)
- [ ] Intégrer la communication backend ↔ micro-service (#99)
- [ ] Stabiliser les migrations Prisma avec #104 (seed et tests)

**Risques anticipés :**
- Délai de déploiement du micro-service en staging (infrastructure DevOps)
- Augmentation de la complexité des tests d'intégration

**Dépendances :**
- Infrastructure MongoDB production confirmée pour fin avril ✅
- Accès aux équipements matériels pour les tests utilisateur (TBD)

---

## 📊 Métriques du Sprint

| Métrique | Valeur |
|----------|--------|
| Vélocité totale | 55 points |
| Points complétés | 55 points (75%) |
| Points reportés | 5 points |
| Taux de complétion | 75% |
| Nombre de PR | 6 |
| Nombre de commits | 38 |
| Couverture de tests | 84% (avg) |

---

**Approuvé par :** Chef de projet TPRE601  
**Date :** 2 mai 2026
