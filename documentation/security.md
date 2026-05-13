# Sécurité

## JWT — Authentification

### Flux complet

```
POST /auth/login
  │  body: { email, password }
  ▼
AuthService.login()
  │  1. Vérifie email + bcrypt.compare(password, hash)
  │  2. Génère access_token (JWT signé, exp: JWT_EXPIRES_IN)
  │  3. Génère refresh_token (32 bytes hex aléatoire)
  │  4. Hash SHA256 du refresh_token → stocké en base (refresh_token_hash)
  ▼
Response: { access_token, refresh_token }
```

```
POST /auth/refresh
  │  body: { refresh_token }
  ▼
AuthService.refresh()
  │  1. Hash SHA256 du token reçu
  │  2. Cherche User par refresh_token_hash
  │  3. Génère nouveau access_token + nouveau refresh_token
  │  4. Met à jour refresh_token_hash en base (rotation)
  ▼
Response: { access_token, refresh_token }
```

### Configuration

| Variable | Défaut | Description |
|---|---|---|
| `JWT_SECRET` | — | **Requis.** Clé de signature des JWT |
| `JWT_EXPIRES_IN` | `900` (15 min) | Durée de vie de l'access token (secondes) |
| `REFRESH_TOKEN_EXPIRES_IN` | `604800` (7 jours) | Durée de vie du refresh token |

### Stratégie Passport (`JwtStrategy`)

Payload JWT : `{ sub: number (userId), email: string }`

Le guard `JwtAuthGuard` (extends `AuthGuard('jwt')`) valide le Bearer token sur chaque endpoint protégé.

---

## CSRF — Protection

`CsrfGuard` est enregistré comme `APP_GUARD` global.

**Comportement :**
- Les méthodes `GET`, `HEAD`, `OPTIONS` sont exemptées.
- Pour toute autre méthode (`POST`, `PUT`, `PATCH`, `DELETE`), si la requête porte un Bearer JWT valide, le header `X-CSRF-Token` ou `X-XSRF-Token` est requis.
- Le token CSRF est obtenu via `GET /auth/csrf` (nécessite un access_token valide).

**Flux CSRF :**
```
1. Client obtient access_token via /auth/login
2. Client appelle GET /auth/csrf → reçoit { token }
3. Client inclut token dans le header X-CSRF-Token de toutes les requêtes mutantes
4. CsrfGuard vérifie le token via CsrfService.verify(token, userId)
```

---

## RBAC — Contrôle d'accès par rôles

### Rôles disponibles

Seedés automatiquement par `RolesService.seedDefaultRoles()` au démarrage :

| Rôle | Description |
|---|---|
| `ADMIN` | Accès total — gestion users, plans, ETL, dashboard |
| `COACH` | Lecture des données utilisateurs, sessions, stats |
| `CLIENT` | Accès à ses propres données uniquement |

### Utilisation dans les controllers

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'COACH')
@Get()
async getUsers() { ... }
```

**Flux `RolesGuard` :**
1. Récupère les rôles requis via le décorateur `@Roles`.
2. Extrait le `userId` du JWT (via `request.user`).
3. Charge le `User` avec son `Role` depuis la base.
4. Si le rôle de l'utilisateur n'est pas dans les rôles requis → `InsufficientRoleException`.

`InsufficientRoleExceptionFilter` (global) intercepte cette exception et retourne une réponse HTTP 403 formatée.

---

## Hachage des tokens

Tous les tokens one-time (reset password, vérification email, refresh token) sont **hashés SHA256** avant stockage. Le token en clair n'est jamais persisté.

Utilitaires dans `src/utils/` :
- `hashPassword(password)` / `verifyPassword(password, hash)` — bcrypt (12 rounds)
- `generateResetToken()` — `crypto.randomBytes(32).toString('hex')`
- `hashResetToken(token)` — `crypto.createHash('sha256').update(token).digest('hex')`

---

## Vérification de compte

```
POST /auth/verify-account/request → email envoyé (lien avec token)
POST /auth/verify-account/confirm { token } → compte activé (is_active: true)
```

TTL du token : `EMAIL_VERIFY_EXPIRES_IN` (défaut: 86400s = 24h).

---

## Réinitialisation de mot de passe

```
POST /auth/password-reset/request { email }
  → Réponse générique (pas d'indication si email existe — sécurité)
  → Email envoyé si l'utilisateur existe

POST /auth/password-reset/confirm { token, new_password }
  → Vérifie token, met à jour password_hash, invalide le token
```

---

## Bonnes pratiques à respecter

- Ne jamais stocker un token en clair en base.
- Ne jamais retourner `password_hash` ou tout hash de token dans les réponses API.
- Les réponses des endpoints "request" (reset, verify) sont toujours génériques.
- Le `ValidationPipe` avec `whitelist: true` rejette automatiquement les champs non définis dans les DTOs.
