# Module Dashboard

`src/dashboard/`

## Rôle

Endpoint de pilotage pour les administrateurs. Agrège les KPIs clés, les métriques de qualité des données, les alertes et les tendances en un seul appel.

## Endpoints

| Méthode | Route | Guards | Description |
|---|---|---|---|
| GET | `/dashboard/pilotage` | JWT + ADMIN | Données de pilotage consolidées |

## Réponse `/dashboard/pilotage`

```json
{
  "kpis": {
    "totalUsers": 350,
    "activeUsers": 280,
    "premiumCount": 90
  },
  "ageGroups": [
    { "label": "18-25", "count": 85 },
    { "label": "26-35", "count": 132 }
  ],
  "objectives": {
    "achieved": 65,
    "total": 100
  },
  "pipelineSummary": {
    "nutrition": { "anomalies": 12, "lastSync": "2026-05-13T08:00:00.000Z" },
    "exercise": { "anomalies": 3, "lastSync": "2026-05-13T08:00:00.000Z" },
    "health-profile": { "anomalies": 7, "lastSync": "2026-05-13T08:00:00.000Z" }
  },
  "dataQuality": 87.4,
  "dataQualityTrend": "up",
  "alerts": [
    { "type": "warning", "message": "12 anomalies en attente dans NutritionStaging" }
  ]
}
```

## DashboardService — logique

`getPilotage()` effectue en parallèle :
1. Comptage utilisateurs (total, actifs, premium)
2. Répartition par tranches d'âge (ageGroups)
3. Suivi des objectifs utilisateurs
4. Résumé des pipelines ETL (anomalies en attente + dernière sync depuis chaque table staging)
5. Score de qualité des données (ratio APPROVED / total staging rows)
6. Tendance de la qualité (comparaison semaine N vs semaine N-1)
7. Génération des alertes si anomalies > seuil

## Tests requis

```typescript
describe('DashboardService', () => {
  describe('getPilotage', () => {
    it('retourne les KPIs: totalUsers, activeUsers, premiumCount')
    it('calcule la répartition par tranches d\'âge')
    it('calcule dataQuality comme ratio APPROVED / total')
    it('génère une alerte si des anomalies dépassent le seuil')
    it('retourne pipelineSummary avec anomalies et lastSync pour chaque pipeline')
  })
})
```
