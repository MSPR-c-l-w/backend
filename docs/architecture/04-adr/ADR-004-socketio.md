# ADR-004 : Socket.IO pour le Temps Réel

**Status:** Accepted  
**Date:** 2026-05-29  
**Décideur:** Architecture Team

---

## Context

Implémenter des notifications temps réel pour :

- Session en cours → mise à jour du dashboard en direct
- Session terminée → broadcast du résumé
- Mises à jour nutrition/exercice → notifications utilisateurs
- Événements admin → alertes système

### Alternatives évaluées

| Technologie               | Avantages                                | Inconvénients                                           |
| ------------------------- | ---------------------------------------- | ------------------------------------------------------- |
| **WebSocket natif**       | Standard, léger, natif                   | Gestion manuelle (reconnexion, fallback)                |
| **Socket.IO**             | Fallbacks automatiques, rooms, namespace | Overhead, dépendance                                    |
| **Server-Sent Events**    | Simple, unidirectionnel                  | One-way only (requête client nécessaire pour broadcast) |
| **GraphQL Subscriptions** | Modern, typed                            | Complexité, overhead GraphQL                            |

---

## Decision

**Utiliser Socket.IO v4 avec NestJS WebSocket Gateway pour broadcasts temps réel.**

### Architecture Socket.IO

```
┌─────────────────────────────────────────────────────────────┐
│ Client (Web / Mobile)                                       │
└─────────────────────────────────────────────────────────────┘
          │
          ├─ WebSocket (natif)
          ├─ HTTP Long-polling (fallback)
          └─ HTTP multiplexing (fallback)
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│ Socket.IO Server (NestJS Gateway)                           │
│  - Port 3001 (/socket.io endpoint)                          │
│  - Authentication via JWT                                   │
│  - Rooms: per-user, per-session, per-organization          │
│  - Namespace: /sessions, /nutrition, /admin                │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│ Services (NestJS)                                           │
│  - SessionService.endSession() → emit                       │
│  - NutritionService.create() → emit                         │
│  - AdminService.alert() → emit                              │
└─────────────────────────────────────────────────────────────┘
```

### Example : Session Updates

```typescript
// SessionService
async endSession(sessionId: number) {
  const session = await this.prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  // Update DB
  await this.prisma.session.update({
    where: { id: sessionId },
    data: { status: 'COMPLETED' },
  });

  // Broadcast to user
  this.eventGateway.broadcastSessionUpdate({
    sessionId,
    userId: session.user_id,
    status: 'COMPLETED',
    summary: { duration: 45, calories: 350 },
  });
}

// EventGateway
@WebSocketGateway({
  namespace: '/sessions',
  cors: { origin: '*' }, // CORS
})
export class EventGateway {
  broadcastSessionUpdate(data: SessionUpdateEvent) {
    this.server
      .to(`user:${data.userId}`)
      .emit('session:update', data);
  }
}
```

---

## Justification

### Pourquoi Socket.IO ?

| Critère                | Valeur                                   |
| ---------------------- | ---------------------------------------- |
| **Auto-reconnect**     | Client reconnecte automatiquement        |
| **Fallback transport** | HTTP polling si WebSocket indisponible   |
| **Rooms & Namespaces** | Organisation logique (topics)            |
| **Broadcasting**       | Emit à plusieurs clients simplement      |
| **Scaling**            | Adaptateur Redis pour multi-serveur      |
| **NestJS intégration** | `@nestjs/websockets` first-class support |

### Patterns Architecture

#### 1. Rooms (topiques)

```typescript
// Joindre une room utilisateur
socket.join(`user:${userId}`);
socket.join(`session:${sessionId}`);
socket.join(`organization:${orgId}`);

// Broadcast à une room
this.server.to(`user:${userId}`).emit('notification', data);
```

#### 2. Namespaces (séparation logique)

```typescript
// Namespaces :
//  - /sessions       → Session events
//  - /nutrition      → Meal updates
//  - /admin          → Admin alerts
//  - /default        → Fallback

@WebSocketGateway({ namespace: '/sessions' })
```

#### 3. Authentication

```typescript
@WebSocketGateway({
  namespace: '/sessions',
})
export class SessionGateway implements OnGatewayConnection {
  handleConnection(client: Socket) {
    const token = client.handshake.auth.token;
    const user = this.jwtService.verify(token);
    client.data.userId = user.sub;
    console.log(`User ${user.sub} connected`);
  }
}
```

---

## Events API

### Définis par le serveur (emit)

| Event             | Payload                                     | Contexte               |
| ----------------- | ------------------------------------------- | ---------------------- |
| `session:started` | `{ sessionId, userId, timestamp }`          | Session commencée      |
| `session:update`  | `{ sessionId, status, duration, calories }` | Session mise à jour    |
| `session:ended`   | `{ sessionId, summary }`                    | Session terminée       |
| `notification`    | `{ type, message, data }`                   | Notification générique |
| `admin:alert`     | `{ level, message }`                        | Alerte admin           |

### Définis par le client (listen)

```typescript
socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('session:update', (data) => {
  console.log('Session updated:', data);
  updateUI(data);
});

socket.on('disconnect', () => {
  console.log('Disconnected, reconnecting...');
});
```

---

## Consequences

### Positives

✅ **Temps réel** : Updates instantanées (< 100ms)  
✅ **Fallback automatique** : Marche même sans WebSocket  
✅ **Scaling** : Adaptateur Redis pour multi-serveur  
✅ **Rooms & Topics** : Broadcasting sélectif simple  
✅ **NestJS intégration** : Decorators, Guards, Pipes support  
✅ **Debugging** : DevTools Socket.IO browser

### Negatives

❌ **Overhead** : Socket.IO > WebSocket pur (compression, protocol)  
❌ **Complexité** : Gestion état client-serveur  
❌ **Memory** : Chaque connection tient en mémoire (watch max connections)  
❌ **Load balancing** : Require sticky sessions ou Redis adapter

---

## Performance & Scaling

### Single Server

```typescript
// Fine jusqu'à ~10k connections concurrentes
// Sur machine 2-core / 4GB RAM
```

### Multi-Server (Redis Adapter)

```typescript
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient();
const subClient = pubClient.duplicate();

io.adapter(
  createAdapter(pubClient, subClient, {
    key: 'socket.io', // Key prefix
  }),
);
```

**Résultat :** Rooms partagées entre serveurs, broadcast global.

---

## Monitoring

### Socket.IO Metrics

```typescript
// Connectées
io.engine.clientsCount;

// Rooms
io.sockets.adapter.rooms.get(`user:${userId}`);

// Memory usage
process.memoryUsage();
```

### Logs

```typescript
// Connexions
socket.on('connect', () => console.log('Connected'));
socket.on('disconnect', () => console.log('Disconnected'));

// Events
socket.onAny((event, data) => console.log(event, data));
```

---

## Sécurité

### ✅ À FAIRE

```typescript
// ✅ Authentifier chaque connection (JWT)
// ✅ Valider permissions avant emit
// ✅ CORS strict (origins whitelist)
// ✅ Rate-limiting sur events
// ✅ Chiffrer sensitive data
// ✅ HTTPS + WSS (WebSocket Secure)
```

### Exemple : Validate permissions

```typescript
@SubscribeMessage('session:join')
handleJoinSession(client: Socket, sessionId: number) {
  // Vérifier que user a accès à session
  const userId = client.data.userId;
  if (!this.canAccessSession(userId, sessionId)) {
    throw new ForbiddenException('Access denied');
  }
  client.join(`session:${sessionId}`);
}
```

---

## Voir aussi

- [ADR-001 : NestJS](ADR-001-nestjs.md)
- [Flux de Données](../05-flux-donnees.md) — Détail WebSocket flows
- [Real-time Events Documentation](../../documentation/etl.md#websocket)
- [@nestjs/websockets documentation](https://docs.nestjs.com/websockets/gateways)
- [Socket.IO Docs](https://socket.io/docs/)
