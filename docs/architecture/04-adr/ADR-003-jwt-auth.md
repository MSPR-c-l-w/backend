# ADR-003 : JWT pour l'Authentification

**Status:** Accepted  
**Date:** 2026-05-29  
**Décideur:** Architecture Team

---

## Context

Implémenter un système d'authentification stateless pour API REST scalable avec :

- Plusieurs clients (web, mobile, admin dashboard)
- Besoins de scaling horizontal (pas de session serveur)
- API WebSocket en temps réel
- CORS cross-origin
- Sécurité : tokens sans état, signature cryptographique

### Alternatives évaluées

| Stratégie     | Avantages                             | Inconvénients                         |
| ------------- | ------------------------------------- | ------------------------------------- |
| **JWT**       | Stateless, scalable, cross-domain     | Révocation difficile, taille token    |
| **Sessions**  | Révocation facile, sécurité classique | Stateful, scaling horizontal complexe |
| **OAuth 2.0** | Délégation, écosystème, SSO           | Overhead, complexe pour API interne   |
| **API Keys**  | Simple, stateless                     | Pas de user context, rotation risquée |

---

## Decision

**Utiliser JWT (JSON Web Tokens) avec refresh token rotation pour l'authentification.**

### Architecture JWT

```
┌─────────────────────────────────────────────────────────────┐
│ Client Login                                                │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│ POST /auth/login { email, password }                        │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│ AuthService:                                                │
│  1. Hash password ← bcrypt.compare()                        │
│  2. Generate access_token (JWT, 15 min)                     │
│  3. Generate refresh_token (random, 7 days)                 │
│  4. Store refresh_token_hash in DB (bcrypt)                │
│  5. Return both tokens to client                            │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│ Client stores:                                              │
│  - access_token in memory (volatile, sûr)                   │
│  - refresh_token in httpOnly cookie (sûr)                   │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│ Requêtes suivantes: Bearer: access_token                    │
│ JwtStrategy valide signature + expiration                   │
└─────────────────────────────────────────────────────────────┘
```

### Token Payload

#### Access Token (JWT)

```json
{
  "sub": 42,
  "email": "user@example.com",
  "iat": 1653456000,
  "exp": 1653456900
}
```

**Durée :** 15 minutes (configurable)

#### Refresh Token

```
Random 32-byte hex: a3f9e2b1c8d5e7f2a9c3b6e1d4f7a2c8
```

**Stockage DB :**

```sql
User.refresh_token_hash (bcrypt du random)
User.refresh_token_expires_at (7 jours)
```

---

## Justification

### Pourquoi JWT ?

| Critère             | Valeur                                            |
| ------------------- | ------------------------------------------------- |
| **Stateless**       | API horizontalement scalable (no session store)   |
| **Cross-domain**    | CORS-friendly (pas de cookie domain restrictions) |
| **Mobile-friendly** | Pas de session cookies, Bearer token simple       |
| **Standards**       | RFC 7519, écosystème riche                        |
| **Performance**     | Vérification signature locale (no DB call)        |

### Pourquoi Refresh Tokens ?

- **Access token court** (15 min) : Risque limité si compromis
- **Refresh token long** (7 jours) : Changement moins fréquent
- **Rotation** : À chaque refresh, nouveau refresh_token généré
- **Révocation** : Effacer `refresh_token_hash` en DB = logout

---

## Implementation Details

### Configuration Environment

```env
JWT_SECRET=your-very-secret-key-min-32-chars
JWT_EXPIRES_IN=900              # 15 minutes (seconds)
REFRESH_TOKEN_EXPIRES_IN=604800 # 7 days (seconds)
```

### Passport Strategy

```typescript
// src/auth/strategies/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: extractors.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  validate(payload: JwtPayload) {
    return { userId: payload.sub, email: payload.email };
  }
}
```

### Guard et Decorator

```typescript
// Protected routes
@Get('/profile')
@UseGuards(JwtAuthGuard)
getProfile(@GetUser() user: User) {
  return user;
}
```

---

## Consequences

### Positives

✅ **Scalabilité horizontale** : Pas d'état serveur, n'importe quel serveur valide le token  
✅ **Performance** : Vérification locale (signature), pas de DB call par requête  
✅ **Sécurité par design** : Tokens signés, expiration courte  
✅ **CORS-friendly** : Bearer token sans restriction domain  
✅ **Mobile/SPA-friendly** : Pas de session cookie limitations

### Negatives

❌ **Révocation lente** : Token valide jusqu'expiration (mitigé par refresh court)  
❌ **Taille token** : Payload augmente si claims nombreux  
❌ **XSS risk** : Token en localStorage vulnérable (mitigation : httpOnly + rotation)  
❌ **Token leakage** : Si stolen, valide 15 min (mitigation : rotation + HTTPS)

---

## Sécurité : Bonnes Pratiques

### ✅ À FAIRE

```typescript
// ✅ HTTPS obligatoire
// ✅ Access token court (15 min)
// ✅ Refresh token httpOnly cookie
// ✅ Signature SHA-256 minimum
// ✅ Rotation: nouveau refresh token à chaque refresh
// ✅ CORS strict (origins whitelist)
// ✅ Rate-limiting sur /auth/login
```

### ❌ À ÉVITER

```typescript
// ❌ Token stocké en localStorage (XSS risk)
// ❌ Secret simple (< 32 caractères)
// ❌ Token très long (> 1 jour)
// ❌ Pas de validation expiration côté client
// ❌ Partage de JWT_SECRET
```

---

## Logout

```typescript
// POST /auth/logout
@Post('logout')
@UseGuards(JwtAuthGuard)
logout(@GetUser() user: User) {
  // Effacer refresh_token_hash en DB
  await this.usersService.clearRefreshToken(user.id);
  return { message: 'Logged out' };
}
```

**Résultat :** Ancien refresh_token invalide → client doit re-login.

---

## Voir aussi

- [ADR-001 : NestJS](ADR-001-nestjs.md)
- [Security Documentation](../../documentation/security.md)
- [Authentication API Endpoints](../../documentation/auth.md)
- [@nestjs/jwt documentation](https://docs.nestjs.com/security/authentication)
