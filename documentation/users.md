# Module Users

`src/users/`

## Rôle

CRUD des utilisateurs avec pagination, recherche et filtrage par plan. Fournit les statistiques globales pour le dashboard admin.

## Endpoints

| Méthode | Route | Guards | Description |
|---|---|---|---|
| GET | `/users` | JWT + ADMIN/COACH | Liste paginée avec filtres |
| GET | `/users/stats` | JWT + ADMIN | Statistiques globales |
| GET | `/users/:id` | JWT + ADMIN/COACH | Détail utilisateur |
| POST | `/users` | — | Créer un utilisateur |
| PUT | `/users/:id` | JWT + ADMIN | Mettre à jour |
| PATCH | `/users/:id/role` | JWT + ADMIN | Changer le rôle |
| DELETE | `/users/:id` | JWT + ADMIN | Suppression soft |

## DTOs

### GetUsersDto (query params)
```typescript
page?: number     // default: 1
limit?: number    // default: 20
search?: string   // Filtre sur first_name, last_name, email
plan?: 'Freemium' | 'Premium' | 'Premium+' | 'B2B'
```

### CreateUserDto
```typescript
email: string         // IsEmail
password: string      // MinLength(12)
first_name: string
last_name: string
date_of_birth: Date
gender: string
height: number
organization_id?: number
```

### UpdateUserDto
Tous les champs de `CreateUserDto` sont optionnels.

### UpdateUserRoleDto
```typescript
role_id: number
```

## Réponses

### GET /users/stats
```json
{
  "totalUsers": 120,
  "activeUsers": 98,
  "premiumUsers": 45,
  "b2bUsers": 12
}
```

### GET /users (paginée)
```json
{
  "data": [ ...User[] ],
  "total": 120
}
```

## Logique métier

**Filtre par plan** (`GetUsersDto.plan`) :
- `Freemium` — utilisateurs sans abonnement actif (pas de subscription avec status ACTIVE)
- `Premium` — abonnement actif sur le plan "Premium"
- `Premium+` — abonnement actif sur le plan "Premium+"
- `B2B` — abonnement actif sur le plan "B2B"

**Soft delete** : `deleteUser()` met `is_deleted: true` et `deleted_at: new Date()` sans supprimer la ligne.

Les requêtes excluent toujours `is_deleted: true`.

## Tests requis

```typescript
describe('UsersService', () => {
  describe('getUsers', () => {
    it('retourne les utilisateurs paginés avec le total')
    it('filtre par search sur email, first_name, last_name')
    it('filtre les utilisateurs Premium (abonnement actif plan Premium)')
    it('filtre les utilisateurs Freemium (sans abonnement actif)')
    it('exclut les utilisateurs supprimés (is_deleted: true)')
  })
  describe('getUserById', () => {
    it('retourne l\'utilisateur avec ses relations')
    it('lève NotFoundException si non trouvé ou is_deleted: true')
  })
  describe('getUsersStats', () => {
    it('calcule correctement totalUsers, activeUsers, premiumUsers, b2bUsers')
  })
  describe('createUser', () => {
    it('crée et retourne le nouvel utilisateur')
    it('lève ConflictException si email déjà utilisé')
  })
  describe('updateUser', () => {
    it('met à jour les champs fournis')
    it('lève NotFoundException si utilisateur inexistant')
  })
  describe('deleteUser', () => {
    it('passe is_deleted à true et renseigne deleted_at')
    it('ne supprime pas physiquement la ligne')
  })
})
```
