# Module Health Profile

`src/health-profile/`

## Rôle

Gestion des profils de santé des utilisateurs (poids, IMC, niveau d'activité, objectif calorique) et déclenchement du pipeline ETL.

## Endpoints

| Méthode | Route | Guards | Description |
|---|---|---|---|
| GET | `/health-profile` | JWT + ADMIN/COACH | Liste de tous les profils (paginée) |
| GET | `/health-profile/me` | JWT | Profil santé de l'utilisateur connecté |
| GET | `/health-profile/:id` | JWT + ADMIN/COACH | Profil santé par ID |
| POST | `/health-profile/import` | JWT + ADMIN | Déclencher le pipeline ETL Kaggle |

## Modèle de réponse (HealthProfile)

```json
{
  "id": 1,
  "user_id": 42,
  "weight": 72.5,
  "bmi": 23.1,
  "physical_activity_level": "Modérément actif",
  "daily_calories_target": 2200,
  "updated_at": "2026-05-14T10:00:00.000Z"
}
```

## Pipeline ETL

**Source** : Kaggle (dataset santé / profils)

**Flux** :
1. Téléchargement via Kaggle API (`KAGGLE_USER` + `KAGGLE_KEY`)
2. Nettoyage des données (IMC, poids, niveaux d'activité)
3. Création d'utilisateurs virtuels si nécessaire (field `usersCreated`)
4. Écriture dans `HealthProfileStaging` (status: PENDING)

**Réponse** :
```json
{
  "message": "Pipeline terminé",
  "imported": 850,
  "updated": 12,
  "usersCreated": 3
}
```

## Tests requis

```typescript
describe('HealthProfileService', () => {
  describe('getHealthProfiles', () => {
    it('retourne la liste paginée des profils')
  })
  describe('getHealthProfile', () => {
    it('retourne le profil si trouvé')
    it('lève NotFoundException si user_id inexistant')
  })
  describe('getMyHealthProfile', () => {
    it('retourne le profil de l\'utilisateur connecté (userId du JWT)')
    it('lève NotFoundException si l\'utilisateur n\'a pas encore de profil')
  })
})
```

## Note

La relation `HealthProfile ↔ User` est **1-1** (`user_id` est unique). Un utilisateur ne peut avoir qu'un seul profil de santé.
