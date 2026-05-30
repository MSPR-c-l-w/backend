# Rapport d'exécution des tests e2e (Supertest) — TPRE601

**Commande :** `pnpm run test:e2e`  
**Config :** `test/jest-e2e.json`  
**Date :** 30 mai 2026  
**Framework :** Jest + Supertest v7

---

## 1. Synthèse

| Indicateur      | Valeur                                 |
| --------------- | -------------------------------------- |
| Fichier de test | `test/app.e2e-spec.ts`                 |
| Suites          | 1                                      |
| Tests           | 1                                      |
| **Pass**        | 0                                      |
| **Fail**        | 1                                      |
| Statut global   | **FAIL** (environnement local sans DB) |

## 2. Détail des cas de test

| ID     | Cas de test        | Endpoint | Attendu    | Résultat | Commentaire                                                              |
| ------ | ------------------ | -------- | ---------- | -------- | ------------------------------------------------------------------------ |
| E2E-01 | Healthcheck racine | `GET /`  | 200 + body | **FAIL** | `DATABASE_URL is required` — AppModule charge PrismaService au bootstrap |

## 3. Erreur observée

```
AppController (e2e) › / (GET)

DATABASE_URL is required to initialize PrismaClient
  at new PrismaService (src/prisma/services/prisma/prisma.service.ts:13:13)
```

**Cause :** les tests e2e importent `AppModule` complet, qui instancie `PrismaService` exigeant `DATABASE_URL`. Sans fichier `.env` et sans MariaDB, le bootstrap échoue avant l'assertion HTTP.

## 4. Correctifs appliqués durant cette issue

| Correctif           | Fichier              | Description                                                                                 |
| ------------------- | -------------------- | ------------------------------------------------------------------------------------------- |
| ✅ moduleNameMapper | `test/jest-e2e.json` | Résolution des imports `src/*` (erreur `Cannot find module 'src/utils/constants'` corrigée) |

## 5. Procédure pour obtenir PASS

```bash
# 1. Configurer l'environnement
cp env.template .env

# 2. Démarrer MariaDB
docker compose up -d

# 3. Migrations + seed
pnpm run prisma:migrate
pnpm run prisma:seed

# 4. Exécuter les e2e
pnpm run test:e2e
```

**Résultat attendu après configuration :**

| ID     | Cas           | Résultat attendu |
| ------ | ------------- | ---------------- |
| E2E-01 | `GET /` → 200 | **PASS**         |

## 6. Roadmap e2e (Sprint 3)

| ID     | Cas de test prévu                                       | Issue / US |
| ------ | ------------------------------------------------------- | ---------- |
| E2E-02 | `POST /auth/login` — credentials valides → 200 + tokens | Auth       |
| E2E-03 | `POST /auth/login` — mauvais mot de passe → 401         | Auth       |
| E2E-04 | `GET /users` — sans JWT → 401                           | RBAC       |
| E2E-05 | `GET /users` — JWT ADMIN → 200 + pagination             | Users #26  |
| E2E-06 | `GET /posts` — pagination cursor                        | Post #167  |

## 7. Recommandations CI

Ajouter un job e2e dans GitHub Actions avec service container MariaDB :

```yaml
services:
  mariadb:
    image: mariadb:11
    env:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: backend_db
    ports:
      - 3306:3306
env:
  DATABASE_URL: mysql://root:rootpassword@localhost:3306/backend_db
```

## 8. Conclusion

La suite e2e actuelle est **minimale** (1 test boilerplate NestJS). L'exécution locale échoue faute de `DATABASE_URL` — comportement attendu documenté. Le correctif `moduleNameMapper` permet désormais le chargement des modules. Les prochains cas e2e couvriront auth et RBAC conformément au [PLAN_DE_TESTS.md](./PLAN_DE_TESTS.md).
