# Architecture

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | NestJS v11 (Node.js) |
| Langage | TypeScript v5.7 |
| Base de données | MariaDB via Prisma ORM v7 |
| Authentification | JWT (Passport) + refresh tokens |
| Temps réel | Socket.IO v4 (IoAdapter) |
| Validation | class-validator + class-transformer |
| Documentation | Swagger (`/api`) |
| Planification | @nestjs/schedule (cron) |
| Tests | Jest v30 + Supertest |
| Lint / Format | ESLint v9 (type-checked) + Prettier v3 |

## Démarrage de l'application (`src/main.ts`)

```
bootstrap()
 ├── CORS global activé
 ├── WebSocket adapter : IoAdapter (Socket.IO)
 ├── Swagger monté sur /api
 ├── ValidationPipe global (whitelist, forbidNonWhitelisted, transform)
 ├── GlobalFilter : InsufficientRoleExceptionFilter
 └── Écoute sur PORT (env) ou 3000
```

## Graphe des modules (`src/app.module.ts`)

```
AppModule
 ├── ScheduleModule (global)
 ├── PrismaModule (@Global — injecte PrismaService partout)
 ├── AuthModule
 │    └── UsersModule
 ├── UsersModule
 ├── RolesModule
 ├── OrganizationModule
 ├── HealthProfileModule
 ├── NutritionModule
 ├── ExerciceModule
 ├── SessionModule
 ├── SessionExerciseModule
 ├── PlanModule
 ├── SubscriptionModule
 ├── AnalyticsModule
 ├── DashboardModule
 ├── EtlModule
 └── PostModule
```

**Providers globaux dans AppModule :**
- `APP_INTERCEPTOR` → `ApiMetricsInterceptor` (log toutes les requêtes)
- `APP_GUARD` → `CsrfGuard` (protection CSRF sur méthodes non-safe)
- `EtlWeeklySchedulerService` (exécution planifiée des pipelines ETL)

## Flux d'une requête HTTP

```
Client
  │
  ▼
CsrfGuard (APP_GUARD — skip sur GET/HEAD/OPTIONS)
  │
  ▼
ApiMetricsInterceptor (APP_INTERCEPTOR — log + métriques)
  │
  ▼
JwtAuthGuard (optionnel, par endpoint)
  │
  ▼
RolesGuard (optionnel, par endpoint)
  │
  ▼
ValidationPipe (DTOs — whitelist + transform)
  │
  ▼
Controller → Service → PrismaService → MariaDB
  │
  ▼
Response
```

## Architecture ETL

Les pipelines ETL **n'écrivent jamais directement** dans les tables métier. Flux :

```
Source externe (Kaggle CSV / GitHub JSON)
  │
  ▼
Service ETL (NutritionService / ExerciceService / HealthProfileService)
  │  - Téléchargement + parsing (PapaParse / fetch)
  │  - Nettoyage et normalisation
  │  - Détection d'anomalies (EtlAnomalyDetectorService)
  ▼
Table Staging (NutritionStaging / ExerciseStaging / HealthProfileStaging)
  │  status = PENDING
  ▼
Revue humaine (Back-office)
  │  PATCH /etl/staging/status → APPROVED | REJECTED
  ▼
Tables finales (Nutrition / Exercise / HealthProfile)
```

EtlWeeklySchedulerService déclenche automatiquement les pipelines chaque semaine.
Les logs ETL sont streamés en temps réel via WebSocket (EtlGateway).

## Découpage fonctionnel des modules

| Domaine | Modules |
|---|---|
| Auth & Accès | `auth`, `users`, `roles`, `organization` |
| Santé & Sport | `health-profile`, `nutrition`, `exercice`, `session`, `session-exercise` |
| Abonnements | `plan`, `subscription` |
| Social | `post` |
| Données & Import | `etl` |
| Pilotage | `analytics`, `dashboard` |
| Infrastructure | `prisma` |

## Convention de nommage des routes

Toutes les routes sont définies dans `src/utils/constants.ts` (enum `Routes`) :

```
auth, users, roles, organizations, exercise, nutrition, plan,
session-exercise, session, health-profile, subscription, dashboard,
analytics, etl, posts
```

## Injection de dépendances

Les tokens de service sont définis dans `src/utils/constants.ts` (enum `SERVICES`) et utilisés pour l'injection dans les modules. Exemple :
```typescript
@Inject(SERVICES.AUTH) private readonly authService: IAuthService
```
