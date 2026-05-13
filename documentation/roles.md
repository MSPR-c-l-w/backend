# Module Roles

`src/roles/`

## Rôle

Gestion des rôles RBAC. Les rôles par défaut sont seedés automatiquement au démarrage de l'application.

## Endpoints

| Méthode | Route | Guards | Description |
|---|---|---|---|
| GET | `/roles` | JWT + ADMIN | Liste tous les rôles |

## Rôles par défaut

Seedés par `RolesService.seedDefaultRoles()` via `OnModuleInit` :

| Nom | Usage |
|---|---|
| `ADMIN` | Accès complet — gestion utilisateurs, ETL, plans, dashboard |
| `COACH` | Lecture des données utilisateurs, sessions, stats |
| `CLIENT` | Accès uniquement à ses propres données |

## Logique

`RolesService` implémente `OnModuleInit`. Au démarrage, il vérifie si les rôles existent et les crée si nécessaire (idempotent via `upsert`).

## Utilisation dans les controllers

Le décorateur `@Roles()` et le `RolesGuard` sont définis dans `src/auth/`. Voir [security.md](security.md) pour les détails RBAC.

## Tests requis

```typescript
describe('RolesService', () => {
  describe('getRoles', () => {
    it('retourne tous les rôles existants')
  })
  describe('seedDefaultRoles (onModuleInit)', () => {
    it('crée ADMIN, COACH, CLIENT si inexistants')
    it('est idempotent — ne crée pas de doublons si les rôles existent')
  })
})
```
