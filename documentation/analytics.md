# Module Analytics

`src/analytics/`

## Rôle

Métriques d'engagement, démographie, tendances nutritionnelles et monitoring des logs API + statut serveur. Toutes les données sont calculées dynamiquement depuis la base.

## Endpoints

| Méthode | Route | Query params | Description |
|---|---|---|---|
| GET | `/analytics/engagement/summary` | `days?` | KPIs d'engagement sur N jours |
| GET | `/analytics/engagement/timeseries` | `days?` | Série temporelle d'engagement |
| GET | `/analytics/progression` | `weeks?` | Progression et satisfaction hebdomadaire |
| GET | `/analytics/demographics-conversion` | — | Démographie et taux de conversion |
| GET | `/analytics/nutrition-trends` | — | Tendances nutritionnelles par profil |
| GET | `/analytics/api-logs/dashboard` | `range?` | Dashboard logs API consolidé |
| GET | `/analytics/api-logs/server-status` | — | Statut temps réel du serveur |

## Paramètre `range` (api-logs/dashboard)

Valeurs acceptées : `'1h'` · `'24h'` · `'7j'` · `'30j'`  
Défaut : `'24h'`

## Réponse server-status

```json
{
  "cpu_usage_percent": 14.2,
  "memory_used_mb": 342,
  "memory_total_mb": 8192,
  "uptime_seconds": 86400,
  "load_average": [0.8, 0.6, 0.4]
}
```

## Services internes

### AnalyticsService
- `getEngagementSummary(days)` — MAU, DAU, sessions, taux de rétention
- `getEngagementTimeseries(days)` — Points de données journaliers
- `getProgression(weeks)` — Objectifs atteints, satisfaction estimée
- `getDemographicsConversion()` — Répartition âge/genre, taux Freemium→Premium
- `getNutritionTrends()` — Moyennes caloriques par profil d'activité

### ApiLogsService
- `getDashboard(range)` — Requêtes/s, taux d'erreur, endpoints les plus appelés, latence
- `getServerStatus()` — Collecte via `MachineStatsService`

### ApiMetricsInterceptor (global)
Intercepte toutes les requêtes et réponses. Stocke les métriques pour `ApiLogsService`.

### MachineStatsService
Collecte les métriques système (CPU, RAM, uptime) via les APIs Node.js (`os` module).

## Tests requis

```typescript
describe('AnalyticsService', () => {
  describe('getEngagementSummary', () => {
    it('calcule les métriques sur le nombre de jours fourni')
    it('utilise 30 jours par défaut si days non fourni')
  })
  describe('getDemographicsConversion', () => {
    it('calcule le taux de conversion Freemium → Premium')
  })
})

describe('ApiLogsService', () => {
  describe('getDashboard', () => {
    it('filtre les logs par range 1h / 24h / 7j / 30j')
  })
  describe('getServerStatus', () => {
    it('retourne cpu_usage_percent, memory_used_mb, uptime_seconds')
  })
})
```
