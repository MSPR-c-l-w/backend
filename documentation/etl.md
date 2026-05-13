# Module ETL

`src/etl/`

## Rôle

Orchestration des pipelines d'import de données depuis des sources externes. Gère les tables staging, la détection d'anomalies, la revue humaine, et le streaming de logs en temps réel via WebSocket.

## Architecture interne

```
EtlController
  ├── EtlService            — Orchestration, logs, verrous de pipeline
  ├── EtlStagingService     — CRUD des tables staging
  ├── EtlAnomalyDetectorService — Détection d'anomalies sur cleaned_data
  └── EtlGateway (WebSocket) — Stream de logs temps réel
```

`EtlWeeklySchedulerService` est enregistré dans `AppModule` et déclenche automatiquement les trois pipelines chaque semaine.

## Pipelines disponibles

| PipelineId | Source | Table staging |
|---|---|---|
| `nutrition` | Kaggle CSV | `NutritionStaging` |
| `exercise` | GitHub JSON | `ExerciseStaging` |
| `health-profile` | Kaggle CSV | `HealthProfileStaging` |

## Endpoints

### Statut et logs

| Méthode | Route | Description |
|---|---|---|
| GET | `/etl/pipelines/status` | `{ nutrition: bool, exercise: bool, health-profile: bool }` — pipeline en cours ? |
| GET | `/etl/pipelines/summary` | `{ nutrition: { anomalies, lastSync }, ... }` |
| GET | `/etl/logs/recent` | Logs récents en mémoire (max 200) |

**Query params de `/etl/logs/recent`** :
```typescript
pipeline?: 'nutrition' | 'exercise' | 'health-profile'
level?: string        // ex: 'info', 'warn', 'error'
limit?: number
```

### Staging — revue humaine

| Méthode | Route | Description |
|---|---|---|
| GET | `/etl/staging` | Lignes PENDING sans anomalies (search, page, limit) |
| GET | `/etl/staging/anomalies` | Lignes PENDING avec anomalies |
| PATCH | `/etl/staging/status` | Approuver / rejeter des lignes |
| PATCH | `/etl/staging/cleaned-data` | Corriger cleaned_data + recalcul des anomalies |
| GET | `/etl/export/final` | Export CSV du dataset final |

**Corps de PATCH `/etl/staging/status`** :
```json
{
  "pipeline": "nutrition",
  "ids": ["uuid1", "uuid2"],
  "status": "APPROVED"
}
```

**Corps de PATCH `/etl/staging/cleaned-data`** :
```json
{
  "pipeline": "nutrition",
  "id": "uuid1",
  "cleaned_data": { "name": "Banane", "calories_kcal": 89 }
}
```

## EtlService — détails

```typescript
// Propriétés
recentLogs: EtlLogEntry[]   // Limité à 200 entrées en mémoire
logSubject: Subject<EtlLogEntry>  // RxJS Subject (stream WebSocket)

// Méthodes
emit(entry: EtlLogEntry): void                    // Émet un log + push dans recentLogs
getStream(): Observable<EtlLogEntry>              // Pour le WebSocket
getRecentLogs(filters): EtlLogEntry[]
isPipelineRunning(pipeline: PipelineId): boolean
getAllPipelineStatuses(): Record<PipelineId, boolean>
runWithPipelineLock(pipeline, fn): Promise<void>  // Empêche l'exécution concurrente
```

## WebSocket (EtlGateway)

Namespace Socket.IO pour streamer les logs ETL en temps réel vers le back-office.

Connexion : `ws://localhost:3000` (namespace ETL)

## Structure d'un log ETL

```typescript
interface EtlLogEntry {
  level: 'info' | 'warn' | 'error'
  message: string
  pipeline: PipelineId
  timestamp: Date
}
```

## Flux complet d'un pipeline

```
1. Déclenchement (manuel via service ou automatique via scheduler)
2. EtlService.runWithPipelineLock() — pose un verrou
3. Téléchargement de la source (fetch / Kaggle API)
4. Parsing CSV / JSON (PapaParse)
5. Nettoyage et normalisation des données
6. EtlAnomalyDetectorService.detect() — analyse les anomalies
7. Écriture dans la table staging (status: PENDING)
8. EtlService.emit() à chaque étape → WebSocket → Back-office
9. Libération du verrou
```

## Types

```typescript
type PipelineId = 'nutrition' | 'exercise' | 'health-profile'
type StagingStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

interface StagingRowDto {
  id: string             // UUID
  cleaned_data: object
  anomalies: object[]
  status: StagingStatus
  created_at: Date
  updated_at: Date
}
```

## Tests requis

```typescript
describe('EtlStagingService', () => {
  describe('findPendingWithoutAnomalies', () => {
    it('retourne uniquement les lignes status=PENDING avec anomalies vides ([])')
    it('applique la pagination (page, limit)')
    it('filtre par search sur cleaned_data')
  })
  describe('findPendingWithAnomalies', () => {
    it('retourne uniquement les lignes status=PENDING avec anomalies non vides')
  })
  describe('updateStatus', () => {
    it('met à jour les lignes ids[] avec le status APPROVED')
    it('met à jour les lignes ids[] avec le status REJECTED')
    it('retourne le nombre de lignes mises à jour')
  })
  describe('updateCleanedDataAndRecheck', () => {
    it('met à jour cleaned_data et recalcule les anomalies')
    it('lève NotFoundException si l\'id n\'existe pas')
  })
})

describe('EtlService', () => {
  describe('runWithPipelineLock', () => {
    it('empêche deux exécutions simultanées du même pipeline')
  })
  describe('emit', () => {
    it('ajoute le log dans recentLogs')
    it('ne dépasse pas 200 entrées dans recentLogs')
  })
  describe('getRecentLogs', () => {
    it('filtre par pipeline')
    it('filtre par level')
    it('applique la limite')
  })
})
```
