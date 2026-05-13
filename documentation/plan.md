# Module Plan

`src/plan/`

## Rôle

CRUD des plans d'abonnement disponibles sur la plateforme.

## Endpoints

| Méthode | Route | Guards | Description |
|---|---|---|---|
| GET | `/plan` | JWT | Liste tous les plans |
| GET | `/plan/:id` | JWT | Détail d'un plan |
| POST | `/plan` | JWT + ADMIN | Créer un plan |
| PUT | `/plan/:id` | JWT + ADMIN | Mettre à jour |
| DELETE | `/plan/:id` | JWT + ADMIN | Supprimer |

## DTOs

### CreatePlanDto
```typescript
name: string      // ex: "Freemium", "Premium", "Premium+", "B2B"
price: number
features: object  // JSON — liste des fonctionnalités incluses
```

### UpdatePlanDto
Tous les champs sont optionnels.

## Modèle de réponse

```json
{
  "id": 1,
  "name": "Premium",
  "price": 9.99,
  "features": { "maxSessions": 100, "etlAccess": true }
}
```

## Note

Le filtre par plan dans `GET /users?plan=Premium` dépend des noms exacts des plans en base. Maintenir la cohérence entre les noms seedés et ceux utilisés dans `UsersService`.

Valeurs de `ACTIVE_SUBSCRIPTION_STATUSES` (constants.ts) : `['ACTIVE', 'active', 'true']`

## Tests requis

```typescript
describe('PlanService', () => {
  it('getPlans — retourne tous les plans')
  it('getPlanById — retourne le plan si trouvé')
  it('getPlanById — lève NotFoundException si inexistant')
  it('createPlan — crée et retourne le plan')
  it('updatePlan — met à jour les champs fournis')
  it('updatePlan — lève NotFoundException si inexistant')
  it('deletePlan — supprime et retourne le plan')
  it('deletePlan — lève NotFoundException si inexistant')
})
```
