# Module Subscription

`src/subscription/`

## Rôle

Consultation des abonnements des utilisateurs. La création d'abonnements est gérée en dehors de ce module (seed ou processus de paiement externe).

## Endpoints

| Méthode | Route | Guards | Description |
|---|---|---|---|
| GET | `/subscription` | JWT + ADMIN | Liste tous les abonnements |
| GET | `/subscription/:id` | JWT + ADMIN | Détail d'un abonnement |

## Modèle de réponse

```json
{
  "id": 1,
  "user_id": 42,
  "plan_id": 2,
  "start_date": "2026-01-01T00:00:00.000Z",
  "end_date": "2026-12-31T00:00:00.000Z",
  "status": "ACTIVE",
  "user": { "id": 42, "email": "user@example.com" },
  "plan": { "id": 2, "name": "Premium", "price": 9.99 }
}
```

## Statuts actifs

Définis dans `src/utils/constants.ts` :
```typescript
ACTIVE_SUBSCRIPTION_STATUSES = ['ACTIVE', 'active', 'true']
```

Ces valeurs sont utilisées dans `UsersService` pour le filtrage par plan.

## Tests requis

```typescript
describe('SubscriptionService', () => {
  it('getSubscriptions — retourne tous les abonnements avec user et plan inclus')
  it('getSubscriptionById — retourne l\'abonnement si trouvé')
  it('getSubscriptionById — lève NotFoundException si inexistant')
})
```
