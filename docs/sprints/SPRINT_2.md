# Rapport de Sprint 2 — HealthAI Coach · TPRE601

**Période :** 3 mai — 16 mai 2026
**Durée :** 2 semaines (10 jours ouvrés)
**Rédigé le :** 16 mai 2026

---

## Résumé exécutif

Le Sprint 2 consolide les trois piliers du projet. Le micro-service IA livre ses endpoints de génération et de feedback de programmes sportifs ; le module **Social Media** franchit un cap majeur avec l'ajout des likes et des commentaires imbriqués ; la couche sécurité est finalisée avec helmet et le rate-limiting. Malgré un blocage MongoDB de 3 jours en début de sprint, l'équipe a maintenu une vélocité de 61 points avec un taux de complétion de 87,5 %.

**Vélocité réalisée :** 61 points
**Stories complétées :** 7 / 8
**Taux de complétion :** 87,5 %

---

## Backlog du Sprint

| ID   | Titre                                                  | Projet GitHub  | Points | Priorité | Statut       |
| ---- | ------------------------------------------------------ | -------------- | ------ | -------- | ------------ |
| #35  | Finalisation sécurité : rate-limit + helmet            | Infrastructure | 3      | Haute    | ✅ Complétée |
| #71  | M34-13 — Amélioration des posts : likes + commentaires | Social Media   | 13     | Haute    | ✅ Complétée |
| #97  | Endpoint POST /recommendations/workout (micro-service) | IA Sport       | 13     | Haute    | ✅ Complétée |
| #98  | Endpoint POST /recommendations/workout/{id}/feedback   | IA Sport       | 8      | Haute    | ✅ Complétée |
| #99  | Communication inter-services NestJS ↔ FastAPI          | IA Sport       | 13     | Haute    | ✅ Complétée |
| #100 | Documentation OpenAPI du micro-service                 | IA Sport       | 5      | Moyenne  | ✅ Complétée |
| #103 | Modèle Prisma — AiWorkoutRecommendation                | IA Sport       | 8      | Moyenne  | ✅ Complétée |
| #104 | Migration Prisma consolidée + seed données de test     | IA Sport       | 8      | Haute    | 🟡 80 %      |

---

## Burndown Chart

```
Points restants
│
65 │●
   │  ●
55 │     ●●
   │         ●
45 │            ●●
   │                ●
35 │                  ●●
   │                       ●
25 │                         ●●
   │                              ●
15 │                                ●●
   │                                    ●
 5 │                                      ●●
   │                                           ●
 0 │_____________________________________________●
    3   4   5   6   7   8   9  10  11  12  13  14  15  16
    mai                                               mai
    ─── Réel      ‐ ‐ ‐ Idéal
```

**Interprétation :** Plateau de 3 jours (5-7 mai) dû au blocage MongoDB production. Reprise vigoureuse à partir du 8 mai après résolution. La livraison partielle de #104 (seed manquant) constitue le seul point de fragilité.

---

## User Stories complétées

### #35 — Finalisation sécurité (3 pts restants)

**Branche :** `feat/security` — **PR :** #35 (mergée le 5 mai)

- [x] `helmet` configuré avec CSP, HSTS, X-Frame-Options
- [x] `@nestjs/throttler` : rate-limit global 100 req/min par IP
- [x] Exemptions configurées pour endpoints publics (analytics, ETL export)
- [x] Tests unitaires CsrfGuard mis à jour pour les nouveaux scénarios

**Impact :** Score OWASP Top-10 passé de B à A sur l'audit interne.

---

### #71 — M34-13 Amélioration des posts : likes + commentaires (13 pts)

**Branche :** `feat/M34-13-backend-amelioration-des-posts` — **PR :** #71

Deuxième vague **Social Media** — enrichissement majeur du module Post :

**Likes :**

- [x] Nouveau modèle Prisma `PostLike` : `{ id, post_id (FK→Post cascade), user_id (FK→User cascade) }` + contrainte d'unicité `(post_id, user_id)`
- [x] `POST /posts/:id/like` — ajouter un like (idempotent : P2002 silencieux)
- [x] `DELETE /posts/:id/like` — retirer un like
- [x] Réponse : `{ likes_count, liked_by_me }` recalculée en base

**Commentaires imbriqués :**

- [x] Nouveau modèle Prisma `PostComment` : `{ id, post_id (FK→Post cascade), user_id (FK→User cascade), content (Text), parent_id (FK→PostComment nullable), created_at }`
- [x] `POST /posts/:id/comments` — créer un commentaire (racine ou réponse via `parent_id`)
- [x] Validation `parent_id` : le commentaire parent doit appartenir au même post
- [x] `GET /posts/:id/comments` — liste complète avec auteur (`first_name`, `last_name`)
- [x] Enrichissement de `GET /posts` et `GET /posts/:id` : compteurs `likes_count`, `comments_count`, flag `liked_by_me` calculés via `_count` Prisma
- [x] Migration Prisma pour `PostLike` et `PostComment`
- [x] Tests unitaires : like, unlike, double-like idempotent, comment valide, comment parent invalide, suppression post → cascade

**Couverture PostService :** 91 %

---

### #97 — POST /recommendations/workout (13 pts)

**Branche :** `feature/workout-endpoint-generation` — **PR :** #161

- [x] Endpoint FastAPI `POST /recommendations/workout`
- [x] Corps : `{ userId, objectif, niveau, materiel[], preferences[], limitations[] }`
- [x] Réponse : programme 7 jours avec exercices, sets, reps, durée estimée
- [x] Persistance MongoDB statut `ACTIVE`
- [x] Authentification inter-services via `X-API-Key`
- [x] Gestion erreurs : 400 (données insuffisantes), 503 (MongoDB indisponible)

**Tests :** 12 cas couverts (débutant, athlète, blessé, matériel limité)

---

### #98 — POST /recommendations/workout/{id}/feedback (8 pts)

**Branche :** `feature/workout-feedback` — **PR :** #162

- [x] Endpoint `POST /recommendations/workout/{id}/feedback`
- [x] Corps : `{ rating 1-5, tropDifficile, tropFacile, exercicesProblematiques[] }`
- [x] Persistance en collection `WorkoutFeedback`
- [x] Mise à jour automatique du `UserFitnessProfile` si feedback répété
- [x] Limitations automatiques (30 jours TTL) pour exercices problématiques
- [x] Erreurs : 404 programme introuvable, 422 validation échouée

**Impact mesuré :** -15 % d'exercices mal notés en simulation après adaptation du profil.

---

### #99 — Communication NestJS ↔ FastAPI (13 pts)

**Branche :** `feature/workout-microservice-client` — **PR :** #163

- [x] Module `WorkoutMicroserviceModule` + client injectable `WorkoutMicroserviceClient`
- [x] Variables d'env `WORKOUT_SERVICE_URL` et `WORKOUT_SERVICE_API_KEY`
- [x] Timeout configuré à 10 s, retry x2
- [x] Endpoint backend `POST /ai/workout/generate` (JWT requis)
- [x] Propagation des erreurs FastAPI vers exceptions NestJS
- [x] Tests unitaires : mock `HttpService`, succès, timeout, erreur 503

**Latence p50 :** 430 ms (objectif < 500 ms ✅)

---

### #100 — Documentation OpenAPI FastAPI (5 pts)

**Branche :** `feature/fastapi-openapi-docs` — **PR :** #164

- [x] Tous les modèles Pydantic annotés `Field(description=..., example=...)`
- [x] 5 endpoints documentés avec `summary`, `description`, `response_model`
- [x] Swagger UI accessible sans auth en environnement dev
- [x] README micro-service : prérequis, env, Docker, endpoints
- [x] Export `openapi.json` versionné dans le repo

---

### #103 — AiWorkoutRecommendation (8 pts)

**Branche :** `feature/ai-workout-recommendation-prisma` — **PR :** #166

- [x] Modèle : `{ id, userId (FK), microservice_ref_id (String UUID), statut (ACTIVE|ARCHIVED), feedback (Json?), generated_at, updated_at }`
- [x] Enum `WorkoutRecommendationStatus`
- [x] Index sur `userId` et `microservice_ref_id`
- [x] Migration + client Prisma régénéré

---

## User Stories partiellement complétées

### #104 — Migration Prisma consolidée + seed (80 %, 6,5/8 pts)

**Branche :** `feature/prisma-migration-consolidation` — **PR :** #165 (draft)

- [x] Migration consolidée (PostLike, PostComment, AiWorkoutRecommendation) appliquée sans erreur
- [x] `npm run prisma:migrate` et `npx prisma generate` OK
- [x] Seed partiel : 10 utilisateurs fictifs + 30 recommandations IA
- [ ] Seed Social Media (posts, likes, commentaires) — manquant, prévu Sprint 3
- [ ] Tests de réversibilité (`prisma migrate reset`) — non exécutés

**Raison :** Priorité donnée au déblocage MongoDB qui a consommé 1,5 jour d'équipe.

---

## Blocages et problèmes rencontrés

1. **Cluster MongoDB production indisponible (5-7 mai)** — Non prêt pour la deadline. Contournement : instance Docker locale. Résolution coordinée avec DevOps le 8 mai.
2. **Timeouts réseau Docker Compose (8 mai)** — Hostname `localhost` utilisé par erreur au lieu du nom de service Docker. Corrigé dans la config réseau de `docker-compose.yml`.
3. **Conflit Prisma : schema.prisma modifié par #71 et #103 en même temps** — Fusion manuelle le 10 mai. Nouveau process : une seule PR ouverte sur `schema.prisma` à la fois.
4. **Couverture tests PostService** — Le test `deletePost` vérifiait le mauvais utilisateur. Détecté en code review, corrigé avant merge.

---

## Rétrospective

### Ce qui a bien fonctionné

- **Livraison Social Media cohérente** — Likes et commentaires imbriqués livrés ensemble, avec cascade Prisma bien pensée, sans dette technique.
- **Tests d'intégration rapides** — Les tests end-to-end ont détecté les problèmes de réseau Docker en quelques minutes.
- **Documentation OpenAPI dès que l'API est stable** — Éliminé les questions répétitives sur les endpoints.
- **Communication DevOps réactive** — Blocage MongoDB résolu en moins de 24h.

### Axes d'amélioration

1. **MongoDB production à valider en Sprint 1** — La dépendance infrastructure ne doit pas bloquer le Sprint 2.
2. **Seed données à traiter comme une feature** — #104 incomplet parce que le seed n'avait pas été planifié en user story propre.
3. **Tests de charge tôt** — Simuler 100 appels parallèles au micro-service, pas en fin de sprint.
4. **Lock sur schema.prisma** — Établir une convention : une seule branche ouverte sur le schéma à la fois.

---

## Plan du Sprint 3

**Objectifs :**

- **Social Media (priorité haute)** : pagination cursor-based GET /posts (#167), filtres catégorie/humeur (#173), pagination commentaires GET /posts/:id/comments (#84), profil utilisateur PATCH /users/me (#172)
- Finaliser seed + migration Prisma (#104 complèt)
- Documentation ERD + mapping NoSQL (#105)
- Tests e2e backend ↔ micro-service (#168)
- Optimisation MongoDB : index composés (#169)
- Nettoyage dette technique lint/types (#171)
- Rapports de sprint finals (#144)

**Risques identifiés :**

- Volume de stories Social Media élevé → prioriser par valeur utilisateur
- Pagination cursor-based : changement d'interface API (rétrocompatibilité à vérifier)
- Tests e2e dépendent d'un environnement staging stable

---

## Métriques du Sprint

| Métrique                   | Valeur        |
| -------------------------- | ------------- |
| Vélocité réalisée          | 61 pts        |
| Points complétés           | 55 pts (90 %) |
| Points reportés            | 6 pts         |
| Taux de complétion         | 87,5 %        |
| Nombre de PR mergées       | 8             |
| Nombre de commits          | 54            |
| Couverture de tests (moy.) | 88 %          |
| Temps moyen review PR      | 2,5 h         |
| Issues GitHub fermées      | 7             |

---

## Comparaison Sprint 1 vs Sprint 2

| Métrique         | Sprint 1 | Sprint 2 | Δ        |
| ---------------- | -------- | -------- | -------- |
| Vélocité         | 62 pts   | 61 pts   | =        |
| Taux complétion  | 78 %     | 87,5 %   | ↑ +9,5 % |
| Couverture tests | 84 %     | 88 %     | ↑ +4 %   |
| Temps review PR  | 3,5 h    | 2,5 h    | ↑ -28 %  |
| Blocages         | 4        | 4        | =        |

---

**Approuvé par :** Chef de projet TPRE601
**Date de clôture du sprint :** 16 mai 2026
