# Référence API

Base URL : `http://localhost:3000`  
Documentation interactive : `http://localhost:3000/api` (Swagger)

**Légende des guards :**
- 🔒 `JWT` — Requiert un `Authorization: Bearer <access_token>`
- 👑 `ADMIN` — Rôle ADMIN requis
- 🎓 `COACH` — Rôle COACH requis (ou ADMIN)
- 👤 `CLIENT` — Rôle CLIENT requis (ou supérieur)

---

## Auth `/auth`

| Méthode | Endpoint | Guards | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Créer un compte + envoi email de vérification |
| POST | `/auth/login` | — | Connexion → `{ access_token, refresh_token }` |
| POST | `/auth/refresh` | — | Rotation du refresh token |
| POST | `/auth/logout` | 🔒 JWT | Révoquer le refresh token |
| POST | `/auth/verify-account/request` | — | Renvoyer l'email de vérification |
| POST | `/auth/verify-account/confirm` | — | Confirmer l'email avec le token |
| POST | `/auth/password-reset/request` | — | Demander un reset de mot de passe |
| POST | `/auth/password-reset/confirm` | — | Confirmer le reset avec le token |
| GET | `/auth/me` | 🔒 JWT | Profil de l'utilisateur connecté |
| GET | `/auth/csrf` | 🔒 JWT | Obtenir un token CSRF |
| GET | `/auth/dev-accounts` | — | Comptes admin par défaut (dev uniquement) |

---

## Users `/users`

| Méthode | Endpoint | Guards | Description |
|---|---|---|---|
| GET | `/users` | 🔒 JWT 👑/🎓 | Liste paginée (page, limit, search, plan) |
| GET | `/users/stats` | 🔒 JWT 👑 | Statistiques globales des utilisateurs |
| GET | `/users/:id` | 🔒 JWT 👑/🎓 | Détail d'un utilisateur |
| POST | `/users` | — | Créer un utilisateur |
| PUT | `/users/:id` | 🔒 JWT 👑 | Mettre à jour un utilisateur |
| PATCH | `/users/:id/role` | 🔒 JWT 👑 | Changer le rôle d'un utilisateur |
| DELETE | `/users/:id` | 🔒 JWT 👑 | Supprimer (soft delete) |

---

## Roles `/roles`

| Méthode | Endpoint | Guards | Description |
|---|---|---|---|
| GET | `/roles` | 🔒 JWT 👑 | Liste tous les rôles |

---

## Organizations `/organizations`

| Méthode | Endpoint | Guards | Description |
|---|---|---|---|
| GET | `/organizations` | — | Liste des organisations actives |
| GET | `/organizations/:id` | — | Détail d'une organisation |
| POST | `/organizations` | 🔒 JWT 👑 | Créer une organisation |
| PUT | `/organizations/:id` | 🔒 JWT 👑 | Mettre à jour |
| DELETE | `/organizations/:id` | 🔒 JWT 👑 | Supprimer (soft delete) |

---

## Health Profile `/health-profile`

| Méthode | Endpoint | Guards | Description |
|---|---|---|---|
| GET | `/health-profile` | 🔒 JWT 👑/🎓 | Liste de tous les profils (paginée) |
| GET | `/health-profile/me` | 🔒 JWT | Profil santé de l'utilisateur connecté |
| GET | `/health-profile/:id` | 🔒 JWT 👑/🎓 | Profil santé par ID |
| POST | `/health-profile/import` | 🔒 JWT 👑 | Déclencher le pipeline ETL Kaggle |

---

## Nutrition `/nutrition`

| Méthode | Endpoint | Guards | Description |
|---|---|---|---|
| GET | `/nutrition` | — | Liste paginée (page, limit) |
| GET | `/nutrition/:id` | — | Détail d'un aliment |
| PUT | `/nutrition/:id` | 🔒 JWT 👑 | Mettre à jour |
| DELETE | `/nutrition/:id` | 🔒 JWT 👑 | Supprimer |
| POST | `/nutrition/import` | 🔒 JWT 👑 | Déclencher le pipeline ETL Kaggle |

---

## Exercise `/exercise`

| Méthode | Endpoint | Guards | Description |
|---|---|---|---|
| GET | `/exercise` | — | Liste paginée (page, limit) |
| GET | `/exercise/search` | — | Recherche (muscle, level, equipment, category) |
| GET | `/exercise/:id` | — | Détail d'un exercice |
| PUT | `/exercise/:id` | 🔒 JWT 👑 | Mettre à jour |
| DELETE | `/exercise/:id` | 🔒 JWT 👑 | Supprimer |
| POST | `/exercise/import` | 🔒 JWT 👑 | Déclencher le pipeline ETL (GitHub JSON) |

---

## Session `/session`

| Méthode | Endpoint | Guards | Description |
|---|---|---|---|
| GET | `/session/dashboard` | 🔒 JWT | KPIs de l'utilisateur connecté |
| GET | `/session/dashboard/:userId` | 🔒 JWT 👑/🎓 | KPIs d'un utilisateur |
| GET | `/session/level` | 🔒 JWT | Niveau de l'utilisateur connecté |
| GET | `/session/level/:userId` | 🔒 JWT 👑/🎓 | Niveau d'un utilisateur |
| GET | `/session/stats/intensity` | 🔒 JWT | Stats d'intensité de l'utilisateur connecté |
| GET | `/session/stats/intensity/:userId` | 🔒 JWT 👑/🎓 | Stats d'intensité d'un utilisateur |
| GET | `/session/history` | 🔒 JWT | Historique de l'utilisateur connecté (filtre: date) |
| GET | `/session/history/:userId` | 🔒 JWT 👑/🎓 | Historique d'un utilisateur |
| GET | `/session/today/summary` | 🔒 JWT | Récap du jour de l'utilisateur connecté |
| GET | `/session/me/:id` | 🔒 JWT | Détail d'une session (utilisateur connecté) |
| GET | `/session/:id` | 🔒 JWT 👑/🎓 | Détail d'une session (admin/coach) |

---

## Session-Exercise `/session-exercise`

| Méthode | Endpoint | Guards | Description |
|---|---|---|---|
| GET | `/session-exercise` | 🔒 JWT 👑/🎓 | Liste toutes les session-exercises |
| GET | `/session-exercise/:sessionId/:exerciseId` | 🔒 JWT | Session-exercise par clé composite |
| GET | `/session-exercise/stats/top-exercises` | 🔒 JWT | Top 5 exercices de l'utilisateur connecté |
| GET | `/session-exercise/stats/top-exercises/:userId` | 🔒 JWT 👑/🎓 | Top 5 d'un utilisateur |
| GET | `/session-exercise/stats/top-exercises-global` | — | Top 5 exercices global |
| POST | `/session-exercise/import` | 🔒 JWT 👑 | Déclencher pipeline ETL sessions Kaggle |

---

## Plan `/plan`

| Méthode | Endpoint | Guards | Description |
|---|---|---|---|
| GET | `/plan` | 🔒 JWT | Liste tous les plans |
| GET | `/plan/:id` | 🔒 JWT | Détail d'un plan |
| POST | `/plan` | 🔒 JWT 👑 | Créer un plan |
| PUT | `/plan/:id` | 🔒 JWT 👑 | Mettre à jour |
| DELETE | `/plan/:id` | 🔒 JWT 👑 | Supprimer |

---

## Subscription `/subscription`

| Méthode | Endpoint | Guards | Description |
|---|---|---|---|
| GET | `/subscription` | 🔒 JWT 👑 | Liste tous les abonnements |
| GET | `/subscription/:id` | 🔒 JWT 👑 | Détail d'un abonnement |

---

## Analytics `/analytics`

| Méthode | Endpoint | Guards | Description |
|---|---|---|---|
| GET | `/analytics/engagement/summary` | — | Résumé d'engagement (query: days?) |
| GET | `/analytics/engagement/timeseries` | — | Série temporelle d'engagement |
| GET | `/analytics/progression` | — | Progression hebdomadaire (query: weeks?) |
| GET | `/analytics/demographics-conversion` | — | Démographie & conversion |
| GET | `/analytics/nutrition-trends` | — | Tendances nutritionnelles |
| GET | `/analytics/api-logs/dashboard` | — | Dashboard logs API (query: range) |
| GET | `/analytics/api-logs/server-status` | — | Statut serveur (CPU, RAM, uptime) |

---

## Dashboard `/dashboard`

| Méthode | Endpoint | Guards | Description |
|---|---|---|---|
| GET | `/dashboard/pilotage` | 🔒 JWT 👑 | KPIs, métriques qualité, alertes, tendances |

---

## ETL `/etl`

| Méthode | Endpoint | Guards | Description |
|---|---|---|---|
| GET | `/etl/pipelines/status` | — | Statut d'exécution de chaque pipeline |
| GET | `/etl/pipelines/summary` | — | Anomalies en attente + dernière sync |
| GET | `/etl/logs/recent` | — | Logs récents (query: pipeline?, level?, limit?) |
| GET | `/etl/staging` | — | Lignes staging PENDING sans anomalies |
| GET | `/etl/staging/anomalies` | — | Lignes staging PENDING avec anomalies |
| GET | `/etl/export/final` | — | Exporter le dataset final en CSV |
| PATCH | `/etl/staging/status` | — | Approuver / rejeter des lignes (APPROVED/REJECTED) |
| PATCH | `/etl/staging/cleaned-data` | — | Modifier cleaned_data + recalcul anomalies |

---

## Posts `/posts`

| Méthode | Endpoint | Guards | Description |
|---|---|---|---|
| GET | `/posts` | 🔒 JWT 👑/🎓/👤 | Liste tous les posts |
| GET | `/posts/:id` | — | Détail d'un post |
| POST | `/posts` | — | Créer un post |
| PUT | `/posts/:id` | — | Mettre à jour un post |
| DELETE | `/posts/:id` | — | Supprimer (auteur ou ADMIN) |
