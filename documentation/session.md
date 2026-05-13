# Module Session

`src/session/`

## Rôle

Tracking des séances d'entraînement. Fournit les KPIs, le niveau d'activité, les statistiques d'intensité, l'historique et le récap du jour.

## Endpoints

| Méthode | Route | Guards | Description |
|---|---|---|---|
| GET | `/session/dashboard` | JWT | KPIs utilisateur connecté |
| GET | `/session/dashboard/:userId` | JWT + ADMIN/COACH | KPIs d'un utilisateur |
| GET | `/session/level` | JWT | Niveau de l'utilisateur connecté |
| GET | `/session/level/:userId` | JWT + ADMIN/COACH | Niveau d'un utilisateur |
| GET | `/session/stats/intensity` | JWT | Stats intensité utilisateur connecté |
| GET | `/session/stats/intensity/:userId` | JWT + ADMIN/COACH | Stats intensité d'un utilisateur |
| GET | `/session/history` | JWT | Historique (query: date) |
| GET | `/session/history/:userId` | JWT + ADMIN/COACH | Historique d'un utilisateur |
| GET | `/session/today/summary` | JWT | Récap du jour |
| GET | `/session/me/:id` | JWT | Détail d'une session (utilisateur connecté) |
| GET | `/session/:id` | JWT + ADMIN/COACH | Détail d'une session |

## Réponses

### GET /session/dashboard
```json
{
  "total_calories": 15420.5,
  "total_hours": 48.3,
  "average_bpm": 142.1,
  "total_sessions": 32
}
```

### GET /session/level
```json
{
  "level": "Athlète",
  "total_calories": 18500
}
```

### GET /session/today/summary
```json
{
  "total_sessions_today": 2,
  "total_duration_h": 1.5,
  "total_calories_burned": 650,
  "average_intensity_percent": 73.2,
  "date": "2026-05-14"
}
```

### GET /session/stats/intensity
```json
{
  "_avg": { "avg_bpm": 138.4 },
  "_max": { "max_bpm": 187 }
}
```

## Logique métier

### Calcul du niveau (`getUserLevel`)

| Calories totales | Niveau |
|---|---|
| > 50 000 | Légende |
| > 10 000 | Athlète |
| > 2 000 | Actif |
| ≤ 2 000 | Débutant |

### Filtre historique (query `date`)

| Format | Comportement |
|---|---|
| `YYYY-MM-DD` | Sessions du jour exact |
| `YYYY-MM` | Sessions du mois |
| Absent | Toutes les sessions |

## Tests requis

```typescript
describe('SessionService', () => {
  describe('getUserLevel', () => {
    it('retourne "Débutant" pour total_calories = 1500')
    it('retourne "Actif" pour total_calories = 3000')
    it('retourne "Athlète" pour total_calories = 15000')
    it('retourne "Légende" pour total_calories = 60000')
  })
  describe('getTodaySummary', () => {
    it('filtre uniquement les sessions d\'aujourd\'hui')
    it('calcule correctement total_duration_h et total_calories_burned')
    it('retourne des zéros si aucune session aujourd\'hui')
  })
  describe('getSessions (historique)', () => {
    it('filtre par date YYYY-MM-DD')
    it('filtre par mois YYYY-MM')
    it('retourne toutes les sessions sans filtre')
  })
  describe('getUserSummary (dashboard)', () => {
    it('calcule total_calories, total_hours, average_bpm, total_sessions')
    it('retourne 0 pour un utilisateur sans sessions')
  })
})
```
