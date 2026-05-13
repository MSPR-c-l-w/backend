# Module Exercise

`src/exercice/` (noter l'orthographe "exercice" dans le code)

## Rôle

CRUD des exercices avec recherche multicritères et pipeline ETL depuis GitHub.

## Endpoints

| Méthode | Route | Guards | Description |
|---|---|---|---|
| GET | `/exercise` | — | Liste paginée (page, limit) |
| GET | `/exercise/search` | — | Recherche par filtres |
| GET | `/exercise/:id` | — | Détail (param: Int) |
| PUT | `/exercise/:id` | JWT + ADMIN | Mettre à jour |
| DELETE | `/exercise/:id` | JWT + ADMIN | Supprimer |
| POST | `/exercise/import` | JWT + ADMIN | Déclencher le pipeline ETL |

## DTOs

### GET /exercise/search (query)
```typescript
muscle?: string       // Filtre sur primary_muscles
level?: string        // 'beginner' | 'intermediate' | 'expert'
equipment?: string
category?: string
```

### UpdateExerciceDto
Tous les champs sont optionnels :
```typescript
name?: string
primary_muscles?: object    // JSON
secondary_muscles?: object  // JSON
level?: string
mechanic?: string
equipment?: string
category?: string
exercise_type?: string
instructions?: object       // JSON
image_urls?: object         // JSON
```

## Pipeline ETL

**Source** : `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json`

**Flux** :
1. Téléchargement JSON depuis GitHub
2. Traduction des champs muscle / equipment / level (dictionnaire interne EN → FR)
3. Construction des URLs d'images : `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/`
4. Nettoyage + détection d'anomalies
5. Écriture dans `ExerciseStaging` (status: PENDING)

Pas de clé API requise (source publique).

## Tests requis

```typescript
describe('ExerciceService', () => {
  describe('getExercices', () => {
    it('retourne les exercices paginés')
    it('applique correctement page et limit')
  })
  describe('getExerciceById', () => {
    it('retourne l\'exercice si trouvé')
    it('lève NotFoundException si id inexistant')
  })
  describe('findByFilters', () => {
    it('filtre par muscle (primary_muscles contient la valeur)')
    it('filtre par level')
    it('filtre par equipment')
    it('filtre par category')
    it('combine plusieurs filtres (AND)')
    it('retourne tous les exercices si aucun filtre')
  })
  describe('updateExercice', () => {
    it('met à jour les champs fournis')
    it('lève NotFoundException si id inexistant')
  })
  describe('deleteExercice', () => {
    it('supprime et retourne l\'exercice')
  })
})
```

## Note

Le dossier dans `src/` s'appelle `exercice` (orthographe française) mais la route HTTP est `/exercise`.
