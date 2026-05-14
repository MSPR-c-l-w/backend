# Guide de contribution

## Prérequis

Avant de commencer, installer les outils requis :

```bash
# Node.js 22 LTS via nvm
nvm install && nvm use

# Activer pnpm via Corepack (inclus avec Node.js)
corepack enable

# Installer les dépendances (inclut commitizen et release-it)
pnpm install
```

---

## Commits conventionnels avec Commitizen

Ce projet utilise les [Conventional Commits](https://www.conventionalcommits.org/fr/). Le format des messages de commit est obligatoire car il alimente automatiquement le `CHANGELOG.md` et les numéros de version lors des releases.

### Utilisation

**Toujours** utiliser cette commande à la place de `git commit` :

```bash
git cz
```

L'assistant interactif pose les questions suivantes :

1. **Type** — nature du changement (voir tableau ci-dessous)
2. **Scope** — module concerné, ex: `auth`, `users`, `etl` (optionnel)
3. **Description** — résumé court en minuscules, sans point final
4. **Corps** — description longue (optionnel)
5. **Breaking change** — si le changement casse la compatibilité
6. **Issue liée** — référence à un ticket (optionnel)

### Types de commits

| Type       | Description                                 | Impact version  |
| ---------- | ------------------------------------------- | --------------- |
| `feat`     | Nouvelle fonctionnalité                     | `minor` (1.x.0) |
| `fix`      | Correction de bug                           | `patch` (1.0.x) |
| `perf`     | Amélioration de performance                 | `patch`         |
| `refactor` | Refactorisation sans changement fonctionnel | —               |
| `docs`     | Documentation uniquement                    | —               |
| `test`     | Ajout ou correction de tests                | —               |
| `build`    | Build, dépendances, scripts                 | —               |
| `ci`       | Configuration de l'intégration continue     | —               |
| `chore`    | Maintenance, tâches diverses                | —               |
| `style`    | Formatage (sans changement logique)         | —               |

Un commit avec `BREAKING CHANGE:` dans le corps ou `!` après le type déclenche une version `major` (x.0.0).

### Exemples

```
feat(auth): ajouter l'authentification OAuth2 Google
fix(session): corriger le calcul des calories totales
perf(nutrition): optimiser la requête de pagination
refactor(etl): extraire la logique de nettoyage dans un service dédié
docs(api): mettre à jour la référence des endpoints ETL
test(users): ajouter les cas limites pour getUserById
build(deps): mettre à jour Prisma vers v7.8
```

Avec breaking change :

```
feat(auth)!: remplacer les sessions par des JWT sans état

BREAKING CHANGE: l'endpoint /auth/session est supprimé.
Utiliser /auth/refresh à la place.
```

---

## Workflow de développement

```bash
# 1. Créer une branche depuis main
git checkout -b feat/nom-de-la-feature

# 2. Développer + vérifications obligatoires
pnpm run lint && pnpm run format && pnpm run build && pnpm run test

# 3. Commiter avec l'assistant
git cz

# 4. Pousser et ouvrir une PR
git push origin feat/nom-de-la-feature
```

---

## Releases avec release-it

Les releases sont gérées par [release-it](https://github.com/release-it/release-it) configuré dans `.release-it.json`.

### Pré-requis avant une release

- Working directory propre (`git status` ne doit rien afficher)
- Branche `main` à jour avec le remote
- Tous les tests passent

### Lancer une release

```bash
# Mode interactif — release-it propose la version à partir des commits
pnpm run release

# Mode automatique (CI)
pnpm run release:patch    # 1.0.0 → 1.0.1  (fixes uniquement)
pnpm run release:minor    # 1.0.0 → 1.1.0  (nouvelles fonctionnalités)
pnpm run release:major    # 1.0.0 → 2.0.0  (breaking changes)
```

### Ce que fait release-it

1. Vérifie que le working directory est propre
2. Incrémente la version dans `package.json`
3. Génère / met à jour `CHANGELOG.md` depuis les commits
4. Crée un commit `chore(release): vX.Y.Z`
5. Pose un tag git annoté `vX.Y.Z`
6. Push le commit et le tag

---

## Structure des commits et CHANGELOG

Les commits sont groupés dans le changelog selon leur type :

| Section du changelog | Types inclus             |
| -------------------- | ------------------------ |
| Fonctionnalités      | `feat`                   |
| Corrections          | `fix`                    |
| Performances         | `perf`                   |
| Refactorisation      | `refactor`               |
| Documentation        | `docs`                   |
| Build & Dépendances  | `build`, `ci`            |
| (cachés)             | `chore`, `style`, `test` |
