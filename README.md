# Backend API — Fitness & Santé

Backend NestJS pour une plateforme de suivi fitness et santé.

**Stack :** NestJS v11, TypeScript, MariaDB via Prisma ORM, JWT, Socket.IO

## 📚 Documentation

- **[Documentation Domaine Métier](documentation/README.md)** — API, modules, DTOs, guides
- **[Documentation Architecture Système](docs/architecture/README.md)** — Diagrammes C4, Infrastructure K8s, ADRs, Sécurité

---

## Prérequis

| Outil   | Version                | Installation                                       |
| ------- | ---------------------- | -------------------------------------------------- |
| Node.js | 22 LTS (voir `.nvmrc`) | [nodejs.org](https://nodejs.org/) ou `nvm install` |
| pnpm    | 10+                    | `corepack enable`                                  |
| Docker  | —                      | [docker.com](https://www.docker.com/)              |

```bash
# Activer la bonne version de Node avec nvm
nvm install && nvm use

# Activer pnpm via Corepack (inclus avec Node.js 22)
corepack enable
```

---

## Installation

```bash
# 1. Installer les dépendances
pnpm install

# 2. Configurer l'environnement
cp env.template .env
# Éditer .env (DATABASE_URL, JWT_SECRET, SMTP, KAGGLE…)

# 3. Démarrer l'infrastructure locale (MariaDB + phpMyAdmin)
docker-compose up -d

# 4. Migrations et client Prisma
pnpm run prisma:migrate
pnpm run prisma:generate

# 5. Données initiales
pnpm run prisma:seed

# 6. Démarrer en mode développement
pnpm run start:dev
```

Swagger disponible sur `http://localhost:3000/api`.  
phpMyAdmin disponible sur `http://localhost:8080` (user: `root` / pass: `rootpassword`).

---

## Commandes

```bash
pnpm run start:dev        # Démarrage en mode watch
pnpm run build            # Compilation TypeScript → dist/
pnpm run lint             # Vérification ESLint
pnpm run lint:fix         # Auto-correction ESLint
pnpm run format:write     # Formatage Prettier
pnpm run test             # Tests unitaires
pnpm run test:cov         # Tests avec couverture
pnpm run test:e2e         # Tests end-to-end
```

### Vérifications obligatoires après chaque modification

```bash
pnpm run lint && pnpm run format && pnpm run build && pnpm run test
```

---

## Workflow Git

### Commits avec Commitizen

Ce projet utilise les [Conventional Commits](https://www.conventionalcommits.org/fr/). **Ne jamais utiliser `git commit -m "..."` directement.** Utilisez toujours l'assistant interactif :

```bash
git cz
```

L'assistant vous guide pour choisir le type, la portée et le message. Les commits alimentent le `CHANGELOG.md` et les releases automatisées.

**Types disponibles :**

| Type       | Quand l'utiliser                            |
| ---------- | ------------------------------------------- |
| `feat`     | Nouvelle fonctionnalité                     |
| `fix`      | Correction de bug                           |
| `perf`     | Amélioration de performance                 |
| `refactor` | Refactorisation sans changement fonctionnel |
| `docs`     | Documentation uniquement                    |
| `test`     | Ajout ou correction de tests                |
| `build`    | Build, dépendances, CI                      |
| `chore`    | Tâches de maintenance                       |

Guide complet : [`documentation/contributing.md`](documentation/contributing.md)

### Releases

```bash
pnpm run release          # Mode interactif (recommandé)
pnpm run release:patch    # 1.0.0 → 1.0.1  (bug fix)
pnpm run release:minor    # 1.0.0 → 1.1.0  (nouvelle fonctionnalité)
pnpm run release:major    # 1.0.0 → 2.0.0  (breaking change)
```

---

## Variables d'environnement

Copier `env.template` vers `.env`. Ne jamais commiter `.env`.

| Variable                     | Requis | Description                                       |
| ---------------------------- | ------ | ------------------------------------------------- |
| `DATABASE_URL`               | Oui    | URL de connexion MariaDB                          |
| `JWT_SECRET`                 | Oui    | Clé de signature des JWT                          |
| `JWT_EXPIRES_IN`             | Non    | Durée access token en secondes (défaut : 900)     |
| `REFRESH_TOKEN_EXPIRES_IN`   | Non    | Durée refresh token en secondes (défaut : 604800) |
| `SMTP_HOST`                  | Prod   | Serveur SMTP pour les emails                      |
| `KAGGLE_USER` / `KAGGLE_KEY` | ETL    | Credentials Kaggle pour les pipelines             |

Référence complète : [`documentation/environment.md`](documentation/environment.md)
