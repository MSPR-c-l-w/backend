# Module Session-Exercise

`src/session-exercise/`

## Rôle

Table de jonction entre `Session` et `Exercise`. Gère les statistiques d'exercices (top 5) et le pipeline d'import des logs de séances depuis Kaggle.

## Endpoints

| Méthode | Route | Guards | Description |
|---|---|---|---|
| GET | `/session-exercise` | JWT + ADMIN/COACH | Liste toutes les session-exercises |
| GET | `/session-exercise/:sessionId/:exerciseId` | JWT | Détail par clé composite (sessions de l'utilisateur connecté) |
| GET | `/session-exercise/stats/top-exercises` | JWT | Top 5 exercices de l'utilisateur connecté |
| GET | `/session-exercise/stats/top-exercises/:userId` | JWT + ADMIN/COACH | Top 5 d'un utilisateur |
| GET | `/session-exercise/stats/top-exercises-global` | — | Top 5 exercices global |
| POST | `/session-exercise/import` | JWT + ADMIN | Déclencher le pipeline ETL |

## Modèle de données

Clé primaire **composite** : `(session_id, exercise_id)`

```typescript
{
  session_id: number    // FK → Session (Cascade delete)
  exercise_id: number   // FK → Exercise (Cascade delete)
}
```

## Réponse Top 5 exercices

```json
[
  { "exercise_id": 12, "name": "Squat", "count": 14 },
  { "exercise_id": 7, "name": "Développé couché", "count": 11 },
  ...
]
```

## Pipeline ETL

**Source** : Kaggle — dataset de logs de séances d'entraînement

**Réponse** : `{ message, count }` — nombre de lignes importées.

Les variables `KAGGLE_USER` et `KAGGLE_KEY` sont requises.

## Tests requis

```typescript
describe('SessionExerciseService', () => {
  describe('getTopExercises', () => {
    it('retourne les 5 exercices les plus fréquents pour l\'utilisateur')
    it('retourne une liste vide si l\'utilisateur n\'a pas de sessions')
  })
  describe('getGlobalTopExercises', () => {
    it('retourne les 5 exercices les plus fréquents globalement')
  })
  describe('getSessionExerciseById', () => {
    it('retourne la session-exercise si elle appartient à l\'utilisateur connecté')
    it('lève NotFoundException si inexistante ou appartenant à un autre utilisateur')
  })
})
```
