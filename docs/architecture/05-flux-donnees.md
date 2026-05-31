# Flux de Données

Documentation complète des flux de données dans le système : API, Database, ETL, WebSocket, Authentification.

---

## 📊 Flux API REST

### Exemple : Création de Nutrition

```mermaid
sequenceDiagram
    actor Client
    participant API as NestJS API
    participant Guard as JwtAuthGuard
    participant Service as NutritionService
    participant ORM as Prisma Client
    participant DB as MariaDB
    participant WS as WebSocket Gateway

    Client->>API: POST /nutrition<br/>{ calories: 2500, ... }
    API->>Guard: Validate Bearer token
    Guard->>Guard: Verify JWT signature<br/>Check expiration
    Guard-->>API: ✓ Valid (userId=42)
    API->>Service: create(userId, payload)
    Service->>ORM: nutrition.create()
    ORM->>DB: INSERT INTO Nutrition
    DB-->>ORM: { id: 1, user_id: 42, ... }
    ORM-->>Service: Nutrition object
    Service->>WS: broadcastNutritionUpdate()
    WS-->>Client: socket.emit('nutrition:created')<br/>{ id: 1, userId: 42, ... }
    Service-->>API: { id: 1, ... }
    API-->>Client: 201 Created<br/>{ id: 1, ... }
```

**Temps total :** ~50ms (local), ~150ms (prod avec latency réseau)

---

## 🔐 Flux d'Authentification JWT

### Login

```
1. Client POST /auth/login { email, password }
        │
        ▼
2. AuthService.login()
   - Query User by email
   - bcrypt.compare(password, user.password_hash)
   - If invalid → 401 Unauthorized
        │
3. Generate tokens:
   - access_token (JWT signed, 15 min)
   - refresh_token (random 32 bytes, 7 days)
   - Store refresh_token_hash in DB
        │
4. Return: {
     access_token: "eyJ0eXAiOiJKV1QiLC...",
     refresh_token: "a3f9e2b1c8d5e7f2a9c3b6e1d4f7a2c8"
   }
```

### Usage (Protected Route)

```
1. Client: GET /profile
   Header: Authorization: Bearer eyJ0eXAiOiJKV1QiLC...
        │
2. JwtAuthGuard:
   - Extract token from Bearer header
   - Verify signature using JWT_SECRET
   - Decode payload
   - Check expiration
   - Return user info to request handler
        │
3. Controller:
   @GetUser() user → { userId: 42, email: "user@ex.com" }
   Return user profile
```

### Refresh Token

```
1. Client: POST /auth/refresh
   Body: { refresh_token: "a3f9e2b1c8d5e7f2a9c3b6e1d4f7a2c8" }
        │
2. AuthService.refresh():
   - Hash refresh_token
   - Find User where refresh_token_hash matches
   - Check expiration
   - Generate new access_token
   - Generate new refresh_token (rotation)
   - Update DB with new hash
        │
3. Return new tokens
        │
4. Client stores new tokens (old refresh_token invalid)
```

---

## 🔄 Flux ETL (Import Nutrition)

### Overview

```mermaid
graph TB
    subgraph "Step 1: Upload"
        Upload["Client uploads CSV"]
        Parse["Parse CSV"]
    end

    subgraph "Step 2: Transform"
        Extract["Extract rows"]
        Validate["Validate each row"]
        Detect["Detect anomalies"]
    end

    subgraph "Step 3: Staging"
        WriteStaging["Write to NutritionStaging<br/>status=PENDING"]
    end

    subgraph "Step 4: Review"
        Dashboard["Admin dashboard"]
        Review["Review anomalies"]
    end

    subgraph "Step 5: Approve"
        UserClick["User clicks Approve"]
        Load["Load to Nutrition table"]
    end

    Upload --> Parse
    Parse --> Extract
    Extract --> Validate
    Validate --> Detect
    Detect --> WriteStaging
    WriteStaging --> Dashboard
    Dashboard --> Review
    Review --> UserClick
    UserClick --> Load

    style WriteStaging fill:#F5A623,stroke:#C17D12,color:#000
    style Review fill:#BD10E0,stroke:#5E0770,color:#fff
```

### Détail Technical

```typescript
// 1. Upload
POST /nutrition/import-csv
  file: File (CSV)

// 2. NutritionService.runImportPipeline()
  - Parse CSV with PapaParse
  - Extract rows → { calories, proteins, ... }
  - Validate each row (schema, ranges)
  - Detect anomalies

// 3. Write Staging
  await prisma.nutritionStaging.create({
    cleaned_data: [...],
    anomalies: [...],
    status: 'PENDING'
  })

  Return stagingId to client

// 4. Admin Review
  GET /nutrition/staging/:id
  Dashboard shows:
    - Cleaned data
    - Anomalies (WARNING, ERROR)
    - Action buttons

// 5. Approve & Load
  PATCH /nutrition/staging/:id/approve

  → Load to main Nutrition table
  → Emit WebSocket notification
  → Return summary
```

---

## 📡 Flux WebSocket (Session Events)

### Connection

```
1. Client connects to socket.io server
   io({
     url: 'http://localhost:3001',
     auth: { token: 'eyJ0...' }
   })
        │
2. SessionGateway.handleConnection()
   - Extract JWT from handshake.auth.token
   - Verify JWT
   - Extract userId
   - Store userId in socket.data
        │
3. Emit: socket:connected
        │
4. Client ready to receive events
```

### Session Update

```
1. User starts session
   POST /sessions { duration_h: 1, ... }
        │
2. SessionController creates session
   → SessionService.startSession()
        │
3. SessionService:
   - Save to DB
   - Emit WebSocket event
   this.eventGateway.broadcastSessionUpdate({
     sessionId: 123,
     userId: 42,
     status: 'STARTED',
     timestamp: Date.now()
   })
        │
4. EventGateway:
   - Find rooms for this session
   io.to(`session:123`).emit('session:started', data)
   io.to(`user:42`).emit('session:updated', data)
        │
5. Client receives:
   socket.on('session:started', (data) => {
     updateDashboard(data)
   })
```

### Rooms Structure

```
Room: user:42
  ├─ Connected clients: [socket_1, socket_2, socket_3]
  └─ All user's devices receive updates

Room: session:123
  ├─ Connected clients: [socket_42, socket_admin, ...]
  └─ Everyone watching this session

Room: organization:1
  ├─ Connected clients: [socket_admin_1, socket_admin_2]
  └─ Organization admins get alerts
```

---

## 🔄 Flux Database Query

### Example: Get User with relations

```typescript
// NestJS Controller
@Get('/profile')
@UseGuards(JwtAuthGuard)
async getProfile(@GetUser() user: User) {
  return this.usersService.getProfileWithRelations(user.id);
}

// Service
async getProfileWithRelations(userId: number) {
  return this.prisma.user.findUnique({
    where: { id: userId },
    include: {
      healthProfile: true,
      organization: true,
      subscriptions: true,
      sessions: {
        take: 10,
        orderBy: { created_at: 'desc' }
      }
    }
  });
}
```

**SQL Generated (Prisma):**

```sql
SELECT u.*, hp.*, o.*, s.*, se.*
FROM User u
LEFT JOIN HealthProfile hp ON hp.user_id = u.id
LEFT JOIN Organization o ON o.id = u.organization_id
LEFT JOIN Subscription s ON s.user_id = u.id
LEFT JOIN Session se ON se.user_id = u.id
WHERE u.id = 42
ORDER BY se.created_at DESC
LIMIT 10
```

---

## 🎯 Flux CRUD Complet

### Create (POST)

```
1. Client POSTs data
2. DTO validation (class-validator)
3. Guard: JWT check
4. Service: business logic
5. Prisma: INSERT
6. Database write
7. WebSocket broadcast (if needed)
8. Return 201 + resource
```

### Read (GET)

```
1. Client GETs resource
2. Guard: JWT check (optional)
3. Service: query with relations
4. Prisma: SELECT + includes
5. Database read
6. Return 200 + data
```

### Update (PATCH)

```
1. Client PATCHes fields
2. DTO validation (partial)
3. Guard: JWT check
4. Guard: permission check (own resource?)
5. Service: UPDATE
6. Prisma: UPDATE
7. Database write
8. WebSocket broadcast
9. Return 200 + updated resource
```

### Delete (DELETE)

```
1. Client DELETEs resource
2. Guard: JWT check
3. Guard: permission check (owner or admin?)
4. Service: soft delete OR hard delete
5. Prisma: UPDATE is_deleted=true OR DELETE
6. Database write
7. WebSocket broadcast
8. Return 204 No Content
```

---

## 📊 Flux Analytics

### Session Summary Calculation (Scheduled)

```typescript
// NestJS @Scheduled cron job
@Cron('0 * * * *') // Every hour
async calculateSessionAnalytics() {
  const sessions = await this.prisma.session.findMany({
    where: {
      created_at: {
        gte: new Date(Date.now() - 3600000) // Last hour
      }
    },
    include: { sessionExercises: true }
  });

  const stats = {
    total_sessions: sessions.length,
    avg_duration: sessions.reduce((sum, s) => sum + s.duration_h) / sessions.length,
    total_calories: sessions.reduce((sum, s) => sum + s.calories_total),
  };

  await this.prisma.analytics.create({
    data: {
      metric: 'sessions_hourly',
      value: stats,
      recorded_at: new Date()
    }
  });
}
```

---

## 🔌 Flux Error Handling

### Exception Flow

```
1. Service throws error
   throw new BadRequestException('Invalid data')
        │
2. GlobalExceptionFilter catches
        │
3. Filter formats response:
   {
     statusCode: 400,
     message: "Invalid data",
     timestamp: "2026-05-29T14:00:00Z"
   }
        │
4. Return HTTP error response
```

---

## 📊 Voir aussi

- [Infrastructure Docker](02-infrastructure-docker.md)
- [Infrastructure Kubernetes](03-infrastructure-kubernetes.md)
- [Réseau et Sécurité](06-reseau-securite.md)
- [ADR-003 : JWT](04-adr/ADR-003-jwt-auth.md)
- [ADR-004 : Socket.IO](04-adr/ADR-004-socketio.md)
- [ADR-005 : ETL](04-adr/ADR-005-etl-staging.md)
