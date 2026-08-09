# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git

Ne jamais ajouter de ligne `Co-Authored-By` dans les messages de commit.

## Commands

```bash
# Development
npm run start:dev       # Watch mode (auto-reload)
npm run build           # Compile TypeScript → dist/
npm run start:prod      # Run compiled build

# Quality checks (run in this order after every change)
npm run lint            # ESLint (type-checked)
npm run lint:fix        # Auto-fix ESLint errors
npm run format          # Prettier check (read-only)
npm run format:write    # Apply Prettier formatting
npm run build           # TypeScript compilation check

# Tests
npm run test            # All unit tests
npm run test:watch      # Watch mode
npm run test:cov        # With coverage
npm run test:e2e        # End-to-end tests

# Prisma
npx prisma generate     # Regenerate client after schema changes
npm run prisma:migrate  # Create + apply migration (dev)
npm run prisma:deploy   # Apply migrations (prod)
npm run prisma:seed     # Seed database

# Local infrastructure
docker-compose up -d    # Start MariaDB + phpMyAdmin (port 8080)
```

## Mandatory checks after every change

After any code modification, run in order: `lint` → `format` → `build` → `test`. After any `prisma/schema.prisma` change, also run `npx prisma generate` and create a migration if schema changes require it.

## Architecture

**Stack:** NestJS v11 + TypeScript, MariaDB via Prisma ORM v7, JWT auth, Socket.IO, Swagger at `/api`.

**Module pattern:** Each domain lives in `src/<domain>/` with a controller, service, DTOs, and interfaces subfolder. The data flow is always: Controller → Service → PrismaService.

**Feature modules:**

- `auth/` — JWT login/register, refresh tokens, email verification, password reset
- `users/`, `roles/`, `organization/` — User management and RBAC
- `health-profile/`, `nutrition/`, `exercice/`, `session/`, `session-exercise/` — Core health/fitness domain
- `plan/`, `subscription/` — Subscription management
- `post/` — Social posts with nested comments (via `parent_id`) and likes
- `analytics/`, `dashboard/` — API metrics and admin dashboard endpoints
- `etl/` — ETL pipeline orchestration with a WebSocket gateway for real-time updates
- `prisma/` — Shared `PrismaService` wrapper

**ETL staging pattern:** ETL pipelines never write directly to the business tables. They write cleaned data to staging tables (`NutritionStaging`, `ExerciseStaging`, `HealthProfileStaging`) for human review before final insertion. Each staging row has `cleaned_data` (JSON), `anomalies` (JSON), and `status` (`PENDING | APPROVED | REJECTED`).

## Conventions

- **No `any`** — use explicit types. If `any` is unavoidable, add a comment or targeted `eslint-disable`.
- **French** — comments and user-facing messages follow the French convention already used in the project.
- **Tests** — mock `PrismaService` (and `HttpService` for ETL pipelines); no real DB or network calls in unit tests.
- **Global pipes** — `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true` is applied globally in `main.ts`. DTOs must use `class-validator` decorators.
- **Prettier:** `singleQuote: true`, `trailingComma: all`.

## Environment

Copy `env.template` to `.env`. Required variables include `DATABASE_URL` (MariaDB), `JWT_SECRET`, JWT/token expiry values, SMTP settings, and `KAGGLE_USER`/`KAGGLE_KEY` for dataset imports.

## Documentation

Full project documentation is in the `documentation/` folder. Key files:

@documentation/architecture.md
@documentation/database.md
@documentation/mcd.md
@documentation/security.md
@documentation/testing.md
@documentation/api-reference.md
