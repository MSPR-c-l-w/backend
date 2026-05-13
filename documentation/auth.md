# Module Auth

`src/auth/`

## Rôle

Gère l'inscription, la connexion, le refresh de token, la vérification d'email, la réinitialisation de mot de passe, et la protection CSRF. Fournit les guards et décorateurs utilisés par tous les autres modules.

## Dépendances

- `UsersModule` (UsersService pour créer/trouver des utilisateurs)
- `PrismaModule`
- `PassportModule`
- `JwtModule`

## Endpoints

| Méthode | Route | Description |
|---|---|---|
| POST | `/auth/register` | Inscription + email de vérification |
| POST | `/auth/login` | Connexion → tokens JWT |
| POST | `/auth/refresh` | Rotation du refresh token |
| POST | `/auth/logout` | Révocation du refresh token |
| POST | `/auth/verify-account/request` | Renvoi de l'email de vérification |
| POST | `/auth/verify-account/confirm` | Activation du compte |
| POST | `/auth/password-reset/request` | Demande de reset mot de passe |
| POST | `/auth/password-reset/confirm` | Confirmation du reset |
| GET | `/auth/me` | Profil de l'utilisateur connecté |
| GET | `/auth/csrf` | Obtenir un token CSRF |
| GET | `/auth/dev-accounts` | Comptes de dev (non-prod) |

## DTOs

### RegisterDto
```typescript
email: string            // IsEmail
password: string         // MinLength(12)
first_name: string
last_name: string
date_of_birth?: Date
gender?: string
height?: number
organization_id?: number
```

### LoginDto
```typescript
email: string            // IsEmail
password: string         // MinLength(8)
```

### RefreshTokenDto
```typescript
refresh_token: string
```

### ConfirmPasswordResetDto
```typescript
token: string
new_password: string     // MinLength(12)
```

### ConfirmAccountVerificationDto
```typescript
token: string
```

## Services

### AuthService

| Méthode | Description |
|---|---|
| `register(dto)` | Crée user, génère token de vérification, envoie email |
| `login(dto)` | Vérifie credentials, génère JWT + refresh token |
| `refresh(dto)` | Valide le refresh token, en génère un nouveau (rotation) |
| `logout(dto)` | Invalide le refresh token (met `null` en base) |
| `getProfile(userId)` | Retourne le user avec organization + role |
| `requestPasswordReset(dto)` | Génère token reset, envoie email (réponse générique) |
| `confirmPasswordReset(dto)` | Vérifie token, met à jour le hash du mot de passe |
| `requestAccountVerification(dto)` | Génère token vérification, envoie email |
| `confirmAccountVerification(dto)` | Active le compte (`is_active: true`) |
| `getDevAdminAccounts()` | Liste les comptes admin du seed |

### MailerService
`sendAccountVerificationEmail(email, token)` — Envoie l'email de vérification via Nodemailer.

### CsrfService
- `issue(userId)` — Génère et stocke un token CSRF lié à l'utilisateur.
- `verify(token, userId)` — Vérifie le token CSRF.

## Guards

### JwtAuthGuard
`extends AuthGuard('jwt')` — Valide le Bearer token sur tout endpoint annoté.

### RolesGuard
Vérifie que l'utilisateur authentifié possède l'un des rôles requis.  
Utilise le décorateur `@Roles('ADMIN', 'COACH')`.  
Lève `InsufficientRoleException` si le rôle est insuffisant.

### CsrfGuard (global)
Vérifie le header `X-CSRF-Token` ou `X-XSRF-Token` sur toutes les requêtes mutantes (POST, PUT, PATCH, DELETE) portant un JWT.

## Décorateur

```typescript
@Roles('ADMIN', 'COACH')  // src/auth/decorators/roles.decorator.ts
```

## Filtre d'exception

`InsufficientRoleExceptionFilter` — Global, retourne HTTP 403 quand `InsufficientRoleException` est levée.

## Tests requis

Fichier : `src/auth/services/auth/auth.service.spec.ts`

```typescript
describe('AuthService', () => {
  describe('register', () => {
    it('crée un utilisateur et retourne un message de succès')
    it('lève ConflictException si l\'email est déjà utilisé')
    it('lève NotFoundException si organization_id est invalide')
  })
  describe('login', () => {
    it('retourne access_token et refresh_token pour des credentials valides')
    it('lève UnauthorizedException si le mot de passe est incorrect')
    it('lève UnauthorizedException si l\'email est inconnu')
    it('lève ForbiddenException si le compte n\'est pas activé (is_active: false)')
  })
  describe('refresh', () => {
    it('retourne de nouveaux tokens pour un refresh_token valide')
    it('lève UnauthorizedException pour un token invalide')
  })
  describe('logout', () => {
    it('met refresh_token_hash à null en base')
  })
  describe('confirmPasswordReset', () => {
    it('met à jour le password_hash et invalide le token')
    it('lève UnauthorizedException pour un token expiré ou invalide')
  })
  describe('confirmAccountVerification', () => {
    it('active le compte (is_active: true)')
    it('lève UnauthorizedException pour un token invalide')
  })
})
```
