# Glossaire

Glossaire des termes métier et techniques utilisés dans l'architecture et la documentation du projet.

---

## 📚 Termes Métier (Domaine Fitness/Santé)

### Session

**Définition :** Une séance d'entraînement horodatée d'un utilisateur.

| Attribut         | Type     | Description                            |
| ---------------- | -------- | -------------------------------------- |
| `id`             | Int      | Identifiant unique                     |
| `user_id`        | Int      | L'utilisateur qui a réalisé la session |
| `duration_h`     | Float    | Durée en heures                        |
| `calories_total` | Int      | Total calories brûlées                 |
| `avg_bpm`        | Int      | Fréquence cardiaque moyenne            |
| `max_bpm`        | Int      | Fréquence cardiaque maximale           |
| `created_at`     | DateTime | Date/heure de création                 |

**Exemple :**

```json
{
  "id": 42,
  "user_id": 7,
  "duration_h": 1.5,
  "calories_total": 350,
  "avg_bpm": 145,
  "max_bpm": 175,
  "created_at": "2026-05-29T14:00:00Z"
}
```

### Session Exercise

**Définition :** Un exercice réalisé durant une session.

| Attribut       | Type  | Description                           |
| -------------- | ----- | ------------------------------------- |
| `id`           | Int   | Identifiant unique                    |
| `session_id`   | Int   | Session parent                        |
| `exercise_id`  | Int   | Référence à Exercise                  |
| `sets`         | Int   | Nombre de séries                      |
| `reps`         | Int   | Répétitions par série                 |
| `weight_kg`    | Float | Poids (kg) pour exercices avec charge |
| `duration_min` | Float | Durée en minutes                      |

**Exemple :**

```json
{
  "id": 1,
  "session_id": 42,
  "exercise_id": 5,
  "sets": 3,
  "reps": 10,
  "weight_kg": 50.0,
  "duration_min": 15
}
```

### Exercise (Exercice)

**Définition :** Type d'exercice (définition, pas instance).

| Attribut        | Type   | Description                      |
| --------------- | ------ | -------------------------------- |
| `id`            | Int    | Identifiant unique               |
| `name`          | String | Nom (ex: "Squat", "Running")     |
| `category`      | String | Catégorie (ex: "Legs", "Cardio") |
| `description`   | String | Description et instructions      |
| `muscle_groups` | Json   | Groupes musculaires travaillés   |

**Catégories typiques :**

- Strength (Musculation)
- Cardio (Course, Vélo)
- Flexibility (Yoga, Étirements)
- Sports (Tennis, Football)

### Nutrition (Meal)

**Définition :** Un repas ou une consommation alimentaire.

| Attribut     | Type     | Description                   |
| ------------ | -------- | ----------------------------- |
| `id`         | Int      | Identifiant unique            |
| `user_id`    | Int      | L'utilisateur                 |
| `name`       | String   | Nom du repas (ex: "Déjeuner") |
| `calories`   | Int      | Calories totales              |
| `proteins_g` | Float    | Protéines (grammes)           |
| `carbs_g`    | Float    | Glucides (grammes)            |
| `fats_g`     | Float    | Lipides (grammes)             |
| `created_at` | DateTime | Date/heure du repas           |

**Macro-nutriments :**

- **Protéines** : 4 kcal/g
- **Glucides** : 4 kcal/g
- **Lipides** : 9 kcal/g

### Health Profile

**Définition :** Profil médical/santé d'un utilisateur.

| Attribut            | Type   | Description                                          |
| ------------------- | ------ | ---------------------------------------------------- |
| `id`                | Int    | Identifiant unique                                   |
| `user_id`           | Int    | L'utilisateur                                        |
| `age`               | Int    | Âge (années)                                         |
| `weight_kg`         | Float  | Poids (kg)                                           |
| `height_cm`         | Float  | Taille (cm)                                          |
| `bmi`               | Float  | IMC (calculé)                                        |
| `target_weight_kg`  | Float  | Poids objectif                                       |
| `activity_level`    | String | Niveau d'activité (Sedentary, Light, Moderate, Very) |
| `health_conditions` | Json   | Conditions médicales (diabète, asthme, etc.)         |

**Formule IMC :**

```
IMC = weight_kg / (height_m)²
```

### Subscription

**Définition :** Abonnement (plan tarifaire) d'un utilisateur.

| Attribut     | Type     | Description                       |
| ------------ | -------- | --------------------------------- |
| `id`         | Int      | Identifiant unique                |
| `user_id`    | Int      | L'utilisateur                     |
| `plan_id`    | String   | Type de plan (FREE, PREMIUM, PRO) |
| `started_at` | DateTime | Début de l'abonnement             |
| `expires_at` | DateTime | Fin de l'abonnement               |
| `status`     | String   | ACTIVE, CANCELLED, EXPIRED        |

**Plans :**

- **FREE** : Accès basique (gratuit)
- **PREMIUM** : Features complètes (accès annuel)
- **PRO** : Support + analytics avancées

### Organization

**Définition :** Organisation (client corporate, gym, etc.).

| Attribut          | Type   | Description            |
| ----------------- | ------ | ---------------------- |
| `id`              | Int    | Identifiant unique     |
| `name`            | String | Nom de l'organisation  |
| `type`            | String | GYM, CORPORATE, CLINIC |
| `branding_config` | Json   | Configuration branding |

---

## 💻 Termes Techniques

### API (Application Programming Interface)

**Définition :** Interface pour communication entre client et serveur.

**Types :**

- **REST** : Basé HTTP, endpoints + méthodes
- **GraphQL** : Query language, flexible
- **WebSocket** : Bidirectionnel temps réel

### JWT (JSON Web Token)

**Définition :** Token signé contenant claims (assertions) sur l'utilisateur.

**Structure :**

```
Header.Payload.Signature
eyJ0eXAiOiJKV1QiLC...
```

### ORM (Object-Relational Mapping)

**Définition :** Abstraction DB permettant requêtes avec objets au lieu de SQL brut.

**Exemples :** Prisma, TypeORM, Sequelize

### DTO (Data Transfer Object)

**Définition :** Objet représentant données en transit (req/res).

**Exemple :**

```typescript
export class CreateUserDto {
  @IsEmail()
  email: string;

  @MinLength(8)
  password: string;

  @IsString()
  firstName: string;
}
```

### ORM (Object-Relational Mapping)

**Définition :** Framework mappant objets code ↔ tables DB.

**Prisma exemple :**

```typescript
const user = await prisma.user.findUnique({
  where: { id: 42 },
});
// Génère : SELECT * FROM User WHERE id = 42
```

### ETL (Extract, Transform, Load)

**Définition :** Processus d'import données externes.

1. **Extract** : Récupérer données (CSV, API)
2. **Transform** : Nettoyer, valider, formater
3. **Load** : Insérer en base finale

### Staging (Table de Staging)

**Définition :** Table temporaire pour ETL avant validation.

**Colonnes typiques :**

- `cleaned_data` : JSON nettoyé
- `anomalies` : JSON erreurs détectées
- `status` : PENDING, APPROVED, REJECTED

### CORS (Cross-Origin Resource Sharing)

**Définition :** Mécanisme sécurité autorisant requêtes cross-domain.

**Exemple :**

```
Origin: https://fitness-app.com
Access-Control-Allow-Origin: https://api.fitness-app.com
→ ✓ Allowed
```

### CSRF (Cross-Site Request Forgery)

**Définition :** Attaque où site malveillant forge requête en votre nom.

**Mitigation :** CSRF tokens, SameSite cookies, origine validation.

### XSS (Cross-Site Scripting)

**Définition :** Injection script malveillant dans page Web.

```javascript
// ❌ Vulnerable
page.innerHTML = `<div>${userInput}</div>`;
if ((userInput = "<script>alert('xss')</script>"))
  // Script exécuté !

  // ✅ Safe
  page.textContent = userInput;
// Escaped, affiche comme texte
```

### WebSocket

**Définition :** Protocole bidirectionnel temps réel (TCP sur HTTP).

**vs HTTP :**

- HTTP : Unidir, stateless, polling
- WebSocket : Bidirectionnel, persist

### Socket.IO

**Définition :** Wrapper WebSocket avec fallbacks, rooms, namespaces.

### Heartbeat / Keepalive

**Définition :** Ping périodique maintenant connection vivante.

**Socket.IO :** Ping toutes les 25s par défaut.

### TLS/SSL

**Définition :** Protocoles chiffrage pour HTTPS/WSS.

- **TLS 1.3** : Recommandé
- **SSL 3.0+** : Obsolète, ne pas utiliser

### Stateless vs Stateful

| Type          | Définition                                           | Exemple              |
| ------------- | ---------------------------------------------------- | -------------------- |
| **Stateless** | Pas de contexte serveur, chaque requête indépendante | JWT API              |
| **Stateful**  | Contexte serveur maintenu (sessions)                 | Server-side sessions |

**API Stateless :** Scaling horizontal facile.

### Middleware

**Définition :** Fonction interceptant requête avant handler.

```typescript
@UseGuards(JwtAuthGuard)  // Middleware = Guard
@Get('/profile')
getProfile() { ... }
```

### Guard

**Définition :** Middleware validant autorisation.

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Delete('/users/:id')
deleteUser() { ... }
```

### Decorator

**Définition :** Syntaxe TypeScript ajoutant métadonnées.

```typescript
@Controller('/users')
@Get(':id')
@UseGuards(JwtAuthGuard)
async getUser() { ... }
```

### Dependency Injection (DI)

**Définition :** Pattern fournissant dépendances plutôt que les créer.

```typescript
// ❌ Manual
const service = new UserService();

// ✅ DI (NestJS)
constructor(private userService: UserService) {}
```

### Transaction

**Définition :** Séquence requêtes atomiques (tout ou rien).

```typescript
await prisma.$transaction(async (tx) => {
  await tx.user.update({ ... });
  await tx.notification.create({ ... });
  // Si erreur : rollback des deux
});
```

### Connection Pooling

**Définition :** Réutilisation connections DB (vs créer nouvelle chaque requête).

**Bénéfice :** Performa, moins de connections ouvertes.

### N+1 Query Problem

**Définition :** Exécuter N queries supplémentaires au lieu de 1 JOIN.

```typescript
// ❌ N+1 Problem
const users = await prisma.user.findMany();
for (const user of users) {
  user.profile = await prisma.healthProfile.findUnique({
    where: { user_id: user.id },
  }); // N queries supplémentaires
}

// ✅ Correct (1 query)
const users = await prisma.user.findMany({
  include: { healthProfile: true },
});
```

### Schema Migration

**Définition :** Versioning des changements schéma DB.

```bash
# Créer migration
npx prisma migrate dev --name add_user_field

# Appliquer en prod
npx prisma migrate deploy
```

### Cron Job

**Définition :** Tâche programmée (ex: toutes les heures).

```typescript
@Cron('0 * * * *') // Chaque heure
async calculateAnalytics() { ... }
```

### ADR (Architecture Decision Record)

**Définition :** Document justifiant une décision architecture.

**Sections :**

- Context : Situation
- Decision : Choix
- Consequences : Impacts
- Alternatives : Options rejetées

---

## 📊 Acronymes

| Acronyme    | Signification                                  |
| ----------- | ---------------------------------------------- |
| **API**     | Application Programming Interface              |
| **JWT**     | JSON Web Token                                 |
| **ORM**     | Object-Relational Mapping                      |
| **DTO**     | Data Transfer Object                           |
| **ETL**     | Extract, Transform, Load                       |
| **CORS**    | Cross-Origin Resource Sharing                  |
| **CSRF**    | Cross-Site Request Forgery                     |
| **XSS**     | Cross-Site Scripting                           |
| **TLS**     | Transport Layer Security                       |
| **SSL**     | Secure Sockets Layer                           |
| **HTTPS**   | HTTP Secure                                    |
| **WSS**     | WebSocket Secure                               |
| **DI**      | Dependency Injection                           |
| **RBAC**    | Role-Based Access Control                      |
| **CRUD**    | Create, Read, Update, Delete                   |
| **HTTP**    | HyperText Transfer Protocol                    |
| **REST**    | Representational State Transfer                |
| **GraphQL** | Graph Query Language                           |
| **K8s**     | Kubernetes                                     |
| **CI/CD**   | Continuous Integration / Continuous Deployment |
| **NPM**     | Node Package Manager                           |
| **pnpm**    | Performant npm                                 |
| **IDE**     | Integrated Development Environment             |
| **CLI**     | Command Line Interface                         |

---

## 🔗 Voir aussi

- [Diagrammes C4](01-diagrammes-c4.md)
- [Documentation Domaine](../../documentation/)
- [ADRs](04-adr/)
