# Module Nutrition

`src/nutrition/`

## Rôle

CRUD des aliments et déclenchement du pipeline ETL d'import depuis Kaggle.

## Endpoints

| Méthode | Route | Guards | Description |
|---|---|---|---|
| GET | `/nutrition` | — | Liste paginée (page, limit) |
| GET | `/nutrition/:id` | — | Détail d'un aliment |
| PUT | `/nutrition/:id` | JWT + ADMIN | Mettre à jour |
| DELETE | `/nutrition/:id` | JWT + ADMIN | Supprimer |
| POST | `/nutrition/import` | JWT + ADMIN | Déclencher le pipeline ETL |

## DTOs

### GET /nutrition (query)
```typescript
page?: number    // default: 1
limit?: number   // default: 20
```

### UpdateNutritionDto
Tous les champs sont optionnels :
```typescript
name?: string
category?: string
calories_kcal?: number
protein_g?: number
carbohydrates_g?: number
fat_g?: number
fiber_g?: number
sugar_g?: number
sodium_mg?: number
cholesterol_mg?: number
meal_type_name?: string
water_intake_ml?: number
picture_url?: string
```

## Réponse paginée

```json
{
  "data": [ ...Nutrition[] ],
  "total": 1250
}
```

## Pipeline ETL

**Source** : Kaggle dataset `adilshamim8/daily-food-and-nutrition-dataset` (CSV)

**Flux** :
1. Téléchargement via Kaggle API (`KAGGLE_USER` + `KAGGLE_KEY`)
2. Parsing CSV avec PapaParse
3. Traduction des champs (Google Translate API)
4. Nettoyage + détection d'anomalies
5. Écriture dans `NutritionStaging` (status: PENDING)

**Réponse** : `{ message, count }` — nombre de lignes importées en staging.

Les variables `KAGGLE_USER` et `KAGGLE_KEY` sont **requises** pour déclencher ce pipeline.

## Tests requis

```typescript
describe('NutritionService', () => {
  describe('getNutritions', () => {
    it('retourne data[] et total correctement')
    it('applique la pagination avec page et limit')
  })
  describe('getNutritionById', () => {
    it('retourne l\'aliment si trouvé')
    it('lève NotFoundException si id inexistant')
  })
  describe('updateNutrition', () => {
    it('met à jour les champs fournis (partiel)')
    it('lève NotFoundException si id inexistant')
  })
  describe('deleteNutrition', () => {
    it('supprime et retourne l\'aliment supprimé')
    it('lève NotFoundException si id inexistant')
  })
})
```

## Notes d'intégration

- Le champ `(name, category)` forme une contrainte d'unicité composite.
- Les `Meal` liés à un aliment sont supprimés en cascade si l'aliment est supprimé.
