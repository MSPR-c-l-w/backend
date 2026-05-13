# Module Organization

`src/organization/`

## Rôle

Gestion des organisations (multi-tenant). Une organisation regroupe des utilisateurs et peut avoir une configuration de branding (couleur, logo).

## Endpoints

| Méthode | Route | Guards | Description |
|---|---|---|---|
| GET | `/organizations` | — | Liste des organisations non supprimées |
| GET | `/organizations/:id` | — | Détail d'une organisation |
| POST | `/organizations` | JWT + ADMIN | Créer |
| PUT | `/organizations/:id` | JWT + ADMIN | Mettre à jour |
| DELETE | `/organizations/:id` | JWT + ADMIN | Soft delete |

## DTOs

### CreateOrganizationDto
```typescript
name: string
type: string
branding_config: {
  primaryColor?: string
  logoUrl?: string
}
is_active?: boolean    // default: true
```

### UpdateOrganizationDto
Tous les champs sont optionnels.

## Logique métier

- **Soft delete** : `deleteOrganization()` passe `is_deleted: true` et `deleted_at: new Date()`.
- Toutes les requêtes de liste filtrent `is_deleted: false`.
- Les utilisateurs liés conservent leur `organization_id` après soft delete (pas de cascade).
- Les `Post` liés à une organisation supprimée ont leur `organization_id` mis à `null` (SetNull).

## Tests requis

```typescript
describe('OrganizationService', () => {
  describe('getOrganizations', () => {
    it('retourne uniquement les organisations avec is_deleted: false')
  })
  describe('getOrganizationById', () => {
    it('retourne l\'organisation si trouvée')
    it('lève NotFoundException si inexistante ou supprimée')
  })
  describe('createOrganization', () => {
    it('crée et retourne l\'organisation')
    it('lève ConflictException si le nom est déjà pris')
  })
  describe('updateOrganization', () => {
    it('met à jour les champs fournis')
    it('lève NotFoundException si inexistante')
  })
  describe('deleteOrganization', () => {
    it('passe is_deleted à true et renseigne deleted_at')
    it('ne supprime pas physiquement la ligne')
  })
})
```
