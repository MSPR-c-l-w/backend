# Documentation — Backend API

Backend NestJS pour une plateforme de fitness & santé. Ce dossier contient la documentation complète du projet.

## Index

| Fichier                                    | Contenu                                                                   |
| ------------------------------------------ | ------------------------------------------------------------------------- |
| [architecture.md](architecture.md)         | Vue d'ensemble, stack, flux de requêtes, graphe des modules               |
| [database.md](database.md)                 | Schéma Prisma, tous les modèles et leurs relations                        |
| [api-reference.md](api-reference.md)       | Référence complète de tous les endpoints                                  |
| [security.md](security.md)                 | JWT, CSRF, RBAC, gestion des tokens                                       |
| [environment.md](environment.md)           | Variables d'environnement requises et optionnelles                        |
| [testing.md](testing.md)                   | Guide de tests, patterns, mocks, exemples                                 |
| [contributing.md](contributing.md)         | Commits conventionnels, Commitizen, workflow de release                   |
| [claude-skills.md](claude-skills.md)       | Skills Claude Code — commandes slash personnalisées (`/create-ticket`, …) |
| [auth.md](auth.md)                         | Module Auth — endpoints, DTOs, guards, services                           |
| [users.md](users.md)                       | Module Users — CRUD, pagination, stats                                    |
| [roles.md](roles.md)                       | Module Roles — RBAC, seed automatique                                     |
| [organization.md](organization.md)         | Module Organization — multi-tenant, branding                              |
| [health-profile.md](health-profile.md)     | Module HealthProfile — métriques utilisateur                              |
| [nutrition.md](nutrition.md)               | Module Nutrition — CRUD, pipeline ETL Kaggle                              |
| [exercise.md](exercise.md)                 | Module Exercise — CRUD, recherche, pipeline ETL                           |
| [session.md](session.md)                   | Module Session — tracking, KPIs, niveaux                                  |
| [session-exercise.md](session-exercise.md) | Module SessionExercise — jonction sessions/exercices                      |
| [plan.md](plan.md)                         | Module Plan — abonnements disponibles                                     |
| [subscription.md](subscription.md)         | Module Subscription — abonnements utilisateurs                            |
| [analytics.md](analytics.md)               | Module Analytics — métriques API, engagement                              |
| [dashboard.md](dashboard.md)               | Module Dashboard — pilotage admin                                         |
| [etl.md](etl.md)                           | Module ETL — pipelines, staging, WebSocket                                |
| [post.md](post.md)                         | Module Post — articles, commentaires, likes                               |

## Démarrage rapide

```bash
corepack enable              # Activer pnpm via Corepack
cp env.template .env         # Configurer les variables d'env
docker-compose up -d         # Démarrer MariaDB + phpMyAdmin
pnpm install
pnpm run prisma:migrate      # Appliquer les migrations
pnpm run prisma:generate     # Générer le client Prisma
pnpm run start:dev           # Démarrer en mode watch
```

Swagger disponible sur `http://localhost:3000/api`.
