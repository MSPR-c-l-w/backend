# Réseau et Sécurité

Documentation détaillée de la configuration réseau, TLS/SSL, authentification, et mesures de sécurité.

---

## 🌐 Ports et Services Exposés

### Développement (Docker Compose)

| Service    | Port | Protocole | Public | Accès                   | Description               |
| ---------- | ---- | --------- | ------ | ----------------------- | ------------------------- |
| API        | 3001 | HTTP      | ✅ OUI | `http://localhost:3001` | Backend API + WebSocket   |
| phpMyAdmin | 8080 | HTTP      | ✅ OUI | `http://localhost:8080` | GUI Database (dev only)   |
| MariaDB    | 3306 | TCP       | ❌ NON | Interne                 | Database (bridge network) |

### Production (Kubernetes + Ingress)

| Service | Port | Protocole | Public | Accès                         | Description             |
| ------- | ---- | --------- | ------ | ----------------------------- | ----------------------- |
| Ingress | 80   | HTTP      | ✅ OUI | Redirect → 443                | HTTP to HTTPS redirect  |
| Ingress | 443  | HTTPS/WSS | ✅ OUI | `https://api.fitness-app.com` | Backend API + WebSocket |
| Backend | 3001 | TCP       | ❌ NON | Interne                       | ClusterIP service       |
| MariaDB | 3306 | TCP       | ❌ NON | Interne                       | Headless service        |

---

## 🔒 TLS/SSL et HTTPS

### Configuration Ingress (Let's Encrypt)

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: backend-ingress
  annotations:
    cert-manager.io/cluster-issuer: 'letsencrypt-prod'
spec:
  tls:
    - hosts:
        - api.fitness-app.com
      secretName: backend-tls-cert
  rules:
    - host: api.fitness-app.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: backend
                port:
                  number: 3001
```

**Certificat :** Auto-renouvelé chaque 90 jours par Let's Encrypt.

### Client HTTPS

```bash
# ✅ Correct (HTTPS)
curl https://api.fitness-app.com/health

# ❌ Éviter (HTTP)
curl http://api.fitness-app.com/health
```

### WebSocket Secure (WSS)

```javascript
// ✅ Production (WSS sur HTTPS)
const socket = io('https://api.fitness-app.com', {
  secure: true,
  rejectUnauthorized: true,
  auth: { token: accessToken },
});

// ✅ Développement (WS sur HTTP)
const socket = io('http://localhost:3001', {
  auth: { token: accessToken },
});
```

---

## 🔐 Authentification JWT

### Bearer Token Flow

```
1. Client stores access_token en mémoire (volatile)
2. Client envoie : Authorization: Bearer eyJ0eXAiOiJKV1QiLC...
3. JwtAuthGuard valide:
   - Vérifie signature (JWT_SECRET)
   - Vérifie expiration
   - Extrait user ID
4. Request autorisée avec userId dans context
```

### Valeurs Par Défaut

```env
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=900              # 15 minutes
REFRESH_TOKEN_EXPIRES_IN=604800 # 7 jours
```

### Sécurité

```bash
# ✅ À FAIRE
- JWT_SECRET: min 32 caractères aléatoires
- JWT_EXPIRES_IN: court (15-30 min)
- Rotation refresh token
- Refresh token httpOnly cookie (pas localStorage)

# ❌ À ÉVITER
- JWT_SECRET court ou simple
- JWT_EXPIRES_IN très long (> 1 jour)
- Token stocké en localStorage
- Partager JWT_SECRET en repo
```

---

## 🛡️ CORS (Cross-Origin Resource Sharing)

### Configuration NestJS

```typescript
// src/main.ts
app.enableCors({
  origin: process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://fitness-app.com',
    'https://admin.fitness-app.com',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 3600,
});
```

### Exemple Requête CORS

```javascript
// Client: https://fitness-app.com

// ✅ Allowed (origin whitelisted)
fetch('https://api.fitness-app.com/profile', {
  method: 'GET',
  headers: { Authorization: 'Bearer ...' },
  credentials: 'include',
});

// ❌ Blocked (origin not whitelisted)
fetch('https://api.malicious-site.com/profile');
// → CORS Error (browser blocks)
```

---

## 📝 CSRF Protection

### Token CSRF (Optional pour API)

Les APIs REST sans cookies n'ont pas besoin de CSRF si :

- ✅ Pas de cookies (stateless JWT)
- ✅ Content-Type: application/json (pas de form)
- ✅ CORS strict

Mais WebSocket avec Socket.IO peut nécessiter CSRF mitigation :

```typescript
// src/event.gateway.ts
@WebSocketGateway({
  cors: {
    origin: ['https://fitness-app.com'],
    credentials: true,
  },
})
export class EventGateway {
  // CSRF mitigation: Verify origin
  @SubscribeMessage('command')
  handleCommand(client: Socket, data: any) {
    const origin = client.handshake.headers.origin;
    if (!this.isAllowedOrigin(origin)) {
      throw new ForbiddenException('Invalid origin');
    }
    // Process command
  }
}
```

---

## 🔒 Sécurité Base de Données

### Credentials (Développement)

```yaml
# ❌ NE PAS utiliser en production
MYSQL_ROOT_PASSWORD: rootpassword
```

### Secrets Kubernetes

```bash
# ✅ Production
kubectl create secret generic mariadb-secrets \
  --from-literal=root-password=$(openssl rand -base64 24)

# Utiliser dans Deployment
env:
  - name: MYSQL_ROOT_PASSWORD
    valueFrom:
      secretKeyRef:
        name: mariadb-secrets
        key: root-password
```

### Connection Pooling

```typescript
// Prisma avec pooling
datasource db {
  provider = "mysql"
  url = env("DATABASE_URL")
}

// DATABASE_URL = "mysql://user:pass@host:3306/db?sslmode=require&connection_limit=20"
```

---

## 🔑 Secrets et Variables d'Environnement

### Sensibles (jamais en repo)

```env
JWT_SECRET=abc123def456...
DATABASE_PASSWORD=secure_password
SMTP_PASSWORD=email_password
KAGGLE_KEY=kaggle_api_key
STRIPE_SECRET_KEY=sk_test_...
```

### Non-sensibles (OK en repo ou .env.example)

```env
NODE_ENV=production
PORT=3001
DATABASE_HOST=mariadb
CORS_ORIGINS=https://fitness-app.com
JWT_EXPIRES_IN=900
LOG_LEVEL=info
```

### .env.example

```bash
# Copier en .env et remplir
cp .env.example .env

# Never commit .env
echo ".env" >> .gitignore
```

---

## 🚨 Rate Limiting

### Configuration (NestJS Throttler)

```typescript
// src/app.module.ts
@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,     // 1 minute
        limit: 100      // 100 requests
      }
    ]),
  ]
})
export class AppModule {}

// Endpoints critiques
@UseGuards(ThrottlerGuard)
@Post('/auth/login')
async login() { ... }

@UseGuards(ThrottlerGuard)
@Post('/auth/refresh')
async refresh() { ... }
```

### Limits Recommandées

| Endpoint         | Limit | Window | Raison                 |
| ---------------- | ----- | ------ | ---------------------- |
| `/auth/login`    | 5     | 15 min | Brute force protection |
| `/auth/refresh`  | 10    | 1 hour | Token refresh          |
| `/auth/register` | 3     | 1 hour | Account creation spam  |
| `/api/*`         | 100   | 1 min  | General API            |

---

## 🔍 Audit & Logging

### Events Loggés

```typescript
// AuthService
- LOGIN_SUCCESS: { userId, email, timestamp }
- LOGIN_FAILED: { email, reason, timestamp }
- TOKEN_REFRESH: { userId, timestamp }
- LOGOUT: { userId, timestamp }

// DataService
- CREATE: { entity, id, userId, timestamp }
- UPDATE: { entity, id, userId, changes, timestamp }
- DELETE: { entity, id, userId, timestamp }

// AdminService
- USER_ROLE_CHANGED: { targetUserId, newRole, adminId }
- STAGING_APPROVED: { stagingId, adminId }
- SYSTEM_ALERT: { level, message }
```

### Log Storage

```bash
# Development
./logs/app.log

# Production (ELK Stack)
Elasticsearch → store logs
Kibana → query & visualize
Logstash → aggregate from services
```

---

## 🛡️ SQL Injection Prevention

### ❌ Vulnerable (SQL injection)

```typescript
// NEVER do this
const query = `SELECT * FROM User WHERE email = '${email}'`;
const user = await prisma.$queryRawUnsafe(query);
```

### ✅ Safe (Prisma parameterized)

```typescript
// GOOD: Prisma escapes automatically
const user = await prisma.user.findUnique({
  where: { email: email },
});

// GOOD: Parameterized query
const user = await prisma.$queryRaw`SELECT * FROM User WHERE email = ${email}`;
```

---

## 🔐 XSS Protection

### Input Sanitization

```typescript
// NestJS ValidationPipe
@Post('/comment')
@Body() dto: CreateCommentDto
async create(@Body(new ValidationPipe({ whitelist: true })) dto: CreateCommentDto) {
  // Content validated & sanitized
}

// DTO
export class CreateCommentDto {
  @IsString()
  @MaxLength(500)
  content: string; // No HTML allowed
}
```

### Output Encoding

```typescript
// Return JSON (automatically escaped)
return {
  id: 1,
  message: "<script>alert('xss')</script>", // Safe, serialized as string
};
```

---

## 📊 Voir aussi

- [Infrastructure Kubernetes](03-infrastructure-kubernetes.md)
- [Infrastructure Docker](02-infrastructure-docker.md)
- [ADR-003 : JWT Authentication](04-adr/ADR-003-jwt-auth.md)
- [Documentation Sécurité](../../documentation/security.md)
- [OWASP Top 10](https://owasp.org/Top10/)
