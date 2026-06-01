# Rapport de Sprint 1 — HealthAI Coach · TPRE601

**Période :** 20 avril — 2 mai 2026
**Durée :** 2 semaines (10 jours ouvrés)
**Rédigé le :** 2 mai 2026

---

## Résumé exécutif

Le Sprint 1 lance officiellement le projet HealthAI Coach sur trois fronts simultanés : la mise en place du micro-service de recommandations sportives (IA), les premières fondations du module Social Media (gestion des posts communautaires), et le renforcement des bases de l'infrastructure (CI/CD, sécurité). Les équipes ont travaillé en parallèle sur ces trois pistes, avec une bonne coordination malgré quelques frictions sur les migrations Prisma partagées.

**Vélocité réalisée :** 62 points
**Stories complétées :** 7 / 9
**Taux de complétion :** 78 %

---

## Backlog du Sprint

| ID   | Titre                                                                | Projet GitHub  | Points | Priorité | Statut       |
| ---- | -------------------------------------------------------------------- | -------------- | ------ | -------- | ------------ |
| #93  | Architecture et setup du micro-service (FastAPI + MongoDB)           | IA Sport       | 13     | Haute    | ✅ Complétée |
| #94  | Schéma MongoDB — WorkoutProgram, UserFitnessProfile, WorkoutFeedback | IA Sport       | 8      | Haute    | ✅ Complétée |
| #95  | Algorithme multi-critères de recommandation sportive                 | IA Sport       | 13     | Haute    | ✅ Complétée |
| #59  | M34-5 — Gestion des posts : CRUD + modèle Prisma                     | Social Media   | 13     | Haute    | ✅ Complétée |
| #62  | Setup CI/CD (GitHub Actions : lint, build, test)                     | Infrastructure | 8      | Haute    | ✅ Complétée |
| #101 | Modèle Prisma — UserAiPreferences                                    | IA Sport       | 8      | Moyenne  | ✅ Complétée |
| #102 | Modèle Prisma — AiNutritionRecommendation                            | IA Sport       | 5      | Moyenne  | ✅ Complétée |
| #35  | Sécurité : CSRF, XSS, SQL injection, brute-force                     | Infrastructure | 8      | Haute    | 🟡 80 %      |
| #100 | Documentation OpenAPI du micro-service FastAPI                       | IA Sport       | 5      | Basse    | ❌ Reportée  |

---

## Burndown Chart

```
Points restants
│
70 │●
   │  ●
60 │     ●
   │       ●●
50 │           ●
   │             ●●
40 │                ●
   │                  ●
30 │                    ●●
   │                        ●
20 │                          ●●
   │                              ●
10 │                                ●●
   │                                    ●
 0 │_______________________________________●
   20  21  22  23  24  25  26  27  28  29  30   1   2
   avr.                                        mai
    ─── Réel      ‐ ‐ ‐ Idéal
```

**Interprétation :** Avancement global conforme. Un palier le 24 avril suite à la révision des points des tickets #95 et #59 en refinement. La résolution rapide du blocage CI (#62) le 22 avril a limité l'impact. Les 2 stories non terminées (#35 et #100) pèsent 13 points reportés sur le Sprint 2.

---

## User Stories complétées

### #93 — Setup micro-service FastAPI + MongoDB (13 pts)

**Branche :** `feature/microservice-setup` — **PR :** #156

- [x] Structure FastAPI initialisée (`/app/routers`, `/app/models`, `/app/services`)
- [x] Connexion MongoDB async via Motor
- [x] Dockerfile + docker-compose.yml opérationnels
- [x] Variables d'env documentées (`MONGODB_URI`, `BACKEND_API_KEY`, `PORT`)
- [x] Endpoint `/health` → `{ status: "ok" }` 200 OK
- [x] Service accessible depuis le backend NestJS via réseau Docker

**Validation :** `curl http://localhost:8001/health` → 200 OK ✅

---

### #94 — Schéma MongoDB (8 pts)

**Branche :** `feature/mongodb-schema` — **PR :** #157

Collections créées avec index sur `userId` :

- **WorkoutProgram** — `{ userId, programme[], statut, generatedAt }`
- **UserFitnessProfile** — `{ userId, objectif, niveau, materiel[], limitations[], historique[] }`
- **WorkoutFeedback** — `{ programId, userId, rating, tropDifficile[], exercicesProblematiques[], createdAt }`

Scripts de seed fournis pour les environnements de test.

---

### #95 — Algorithme multi-critères (13 pts)

**Branche :** `feature/scoring-algorithm` — **PR :** #158

- [x] Fonction `scoreExercise()` — score normalisé 0→1
- [x] Pondération : objectif 40 %, niveau 25 %, matériel 20 %, préférences 10 %, limitations 5 %
- [x] Exclusion automatique des exercices incompatibles (limitation physique, matériel manquant)
- [x] Sélection top-N par groupe musculaire pour équilibre du programme
- [x] Tests unitaires : profil débutant, athlète confirmé, blessure genou

**Couverture :** 87 % des lignes

---

### #59 — M34-5 Gestion des posts (13 pts)

**Branche :** `feat/M34-5-backend-gestion-des-posts` — **PR :** #59

Premier bloc fonctionnel du module **Social Media** :

- [x] Modèle Prisma `Post` : `{ id, author_id, organization_id, title, content (LongText), media_url (VarChar 2048), is_published, created_at, updated_at }`
- [x] Relations : `User` (auteur, cascade delete), `Organization` (optionnelle, setNull)
- [x] Endpoints CRUD : `GET /posts`, `GET /posts/:id`, `POST /posts`, `PUT /posts/:id`, `DELETE /posts/:id`
- [x] Suppression protégée : seul l'auteur ou un ADMIN peut supprimer
- [x] `ValidationPipe` appliqué sur `CreatePostDto` et `UpdatePostDto`
- [x] Migration Prisma appliquée sans conflit
- [x] Tests unitaires `PostService` : créer, lire, interdire la suppression par un tiers

**Couverture service :** 82 %

---

### #62 — CI/CD GitHub Actions (8 pts)

**Branche :** `feat/ci` — **PR :** #62

- [x] Workflow `ci.yml` : lint → build → test sur chaque PR
- [x] Jobs séparés : `lint`, `build`, `test` (parallélisés)
- [x] Cache `node_modules` entre jobs
- [x] Badge de statut intégré au README
- [x] Échec bloquant si couverture < 80 %

---

### #101 — UserAiPreferences (8 pts)

**Branche :** `feature/user-ai-preferences-prisma` — **PR :** #159

- [x] Modèle Prisma : `{ id, userId (unique FK), allergies (Json), regime, budget, objectifIa, contraintes_materielles (Json), updated_at }`
- [x] Relation 1-1 User (cascade delete)
- [x] Endpoint `PUT /users/me/ai-preferences` (JWT requis)
- [x] Migration et génération client Prisma

---

### #102 — AiNutritionRecommendation (5 pts)

**Branche :** `feature/ai-nutrition-prisma` — **PR :** #160

- [x] Modèle Prisma : `{ id, userId (FK), type (ANALYSIS|MEAL_PLAN), input_image_url, aliments_detectes, macros, suggestions, meal_plan, created_at }`
- [x] Enum `AiRecommendationType`
- [x] Index sur `userId` et `created_at`
- [x] Migration appliquée, client régénéré

---

## User Stories partiellement complétées

### #35 — Sécurité (80 %, 6/8 pts)

**Branche :** `feat/security` — **PR :** #35 (draft)

- [x] Protection CSRF : `CsrfGuard` en `APP_GUARD` global — skip GET/HEAD/OPTIONS
- [x] Endpoint `GET /auth/csrf` → token CSRF lié au JWT
- [x] Sanitisation XSS des champs texte libres
- [x] Protection brute-force login : verrouillage après 5 tentatives
- [ ] Limitation de débit globale (rate-limit) — en cours (dépendance sur `@nestjs/throttler` à valider)
- [ ] Audit des headers de sécurité HTTP (`helmet`) — démarré

**Raison report :** Choix de la configuration `helmet` complexifié par le mode CORS utilisé en dev. À finaliser Sprint 2.

---

## User Stories reportées

### #100 — Documentation OpenAPI FastAPI (5 pts)

**Raison :** L'endpoint principal `/recommendations/workout` n'est pas encore implémenté (Sprint 2). Documenter une API incomplète n'apporte pas de valeur.

---

## Blocages et problèmes rencontrés

1. **Conflit migration Prisma (#101 vs #102)** — Deux PRs ont touché `schema.prisma` simultanément le 26 avril. Fusion manuelle requise. **Solution adoptée :** une seule PR de migration par sprint, coordonnée en début de sprint.
2. **CI cassée le 21 avril** — Le cache `node_modules` corrompait les builds. Résolu en 2h en réinitialisant la clé de cache.
3. **Communication inter-services** — Le header `X-API-Key` entre NestJS et FastAPI mal configuré initialement. Documenté dans la PR #156.
4. **MongoDB index composés** — Délai de création d'index (userId + created_at) : résolu après discussion avec DevOps le 25 avril.

---

## Rétrospective

### Ce qui a bien fonctionné

- **Trois pistes parallèles sans collisions majeures** — Le découpage IA / Social Media / Infrastructure a permis à chaque binôme de travailler sans bloquer les autres.
- **Daily standup à 15 min** — Format resté court et focalisé, bon alignement d'équipe.
- **Onboarding FastAPI fluide** — Les développeurs backend ont pris en main le micro-service en moins de deux jours.
- **Module Social Media livré complet** — Le CRUD posts est fonctionnel, testé et prêt à être enrichi.

### Axes d'amélioration

1. **Coordination migrations Prisma** — Planifier les migrations en début de sprint, pas en cours de route.
2. **Tests d'intégration inter-services tôt** — Le test backend↔micro-service a été fait en fin de sprint seulement.
3. **Guide "Setup local"** — Plusieurs nouvelles personnes ont perdu du temps à configurer Docker + MongoDB. Un doc dédié s'impose.
4. **Démarrer la sécurité avant les fonctionnalités** — `#35` aurait dû ouvrir le sprint, pas le fermer.

---

## Plan du Sprint 2

**Objectifs :**

- Finaliser la sécurité (#35) : rate-limit + helmet
- Implémenter les endpoints workout IA (#97) et feedback (#98)
- Intégration backend ↔ micro-service (#99)
- Documenter l'API FastAPI (#100)
- **Social Media** : améliorer les posts — système de likes, commentaires imbriqués (#71)
- Consolider les migrations Prisma (#103, #104)

**Risques identifiés :**

- Infrastructure MongoDB staging pas encore confirmée
- Complexité croissante des tests d'intégration
- Le module commentaires peut impacter le schéma Prisma (table `PostComment`)

---

## Métriques du Sprint

| Métrique                   | Valeur        |
| -------------------------- | ------------- |
| Vélocité réalisée          | 62 pts        |
| Points complétés           | 55 pts (89 %) |
| Points reportés            | 13 pts        |
| Taux de complétion         | 78 %          |
| Nombre de PR mergées       | 7             |
| Nombre de commits          | 43            |
| Couverture de tests (moy.) | 84 %          |
| Issues GitHub fermées      | 7             |

---

**Approuvé par :** Chef de projet TPRE601
**Date de clôture du sprint :** 2 mai 2026
