# Base de données

## Configuration

- **SGBD** : MariaDB (MySQL-compatible)
- **ORM** : Prisma v7
- **Schéma** : `prisma/schema.prisma`
- **Migrations** : `prisma/migrations/`
- **Seed** : `prisma/seed.ts`

## Commandes Prisma

```bash
npm run prisma:migrate    # Créer + appliquer une migration (dev)
npm run prisma:deploy     # Appliquer les migrations (prod)
npm run prisma:generate   # Régénérer le client après modif du schéma
npm run prisma:seed       # Peupler la base avec les données initiales
```

**Règle** : toute modification de `prisma/schema.prisma` doit être suivie de `npx prisma generate`.

---

## Modèles

### User

| Champ | Type | Notes |
|---|---|---|
| id | Int PK | Auto-increment |
| email | String | Unique |
| password_hash | String | bcrypt (12 rounds) |
| refresh_token_hash | String? | Unique, SHA256 |
| email_verification_token_hash | String? | Unique, SHA256 |
| reset_password_token_hash | String? | Unique, SHA256 |
| first_name | String | |
| last_name | String | |
| date_of_birth | DateTime? | |
| gender | String? | |
| height | Float? | En cm |
| organization_id | Int? | FK → Organization |
| role_id | Int? | FK → Role |
| is_active | Boolean | default: true |
| is_deleted | Boolean | default: false |
| created_at | DateTime | default: now() |
| updated_at | DateTime | @updatedAt |
| deleted_at | DateTime? | Soft delete |

**Relations** : Organization, Role, HealthProfile (1-1), Session[], Meal[], Subscription[], Post[]

---

### Organization

| Champ | Type | Notes |
|---|---|---|
| id | Int PK | |
| name | String | Unique |
| type | String | |
| branding_config | Json | `{ primaryColor?, logoUrl? }` |
| is_active | Boolean | default: true |
| is_deleted | Boolean | default: false |
| created_at / updated_at / deleted_at | DateTime | Audit |

**Relations** : User[], Post[]

---

### Role

| Champ | Type | Notes |
|---|---|---|
| id | Int PK | |
| name | String | Unique |

Rôles seedés automatiquement : `ADMIN`, `COACH`, `CLIENT`

**Relations** : User[]

---

### HealthProfile

| Champ | Type | Notes |
|---|---|---|
| id | Int PK | |
| user_id | Int | Unique, FK → User (Cascade) |
| weight | Float | |
| bmi | Float | |
| physical_activity_level | String | |
| daily_calories_target | Int | |
| updated_at | DateTime | @updatedAt |

**Relations** : User (1-1)

---

### Session

| Champ | Type | Notes |
|---|---|---|
| id | Int PK | |
| user_id | Int | FK → User (Cascade) |
| duration_h | Float | |
| calories_total | Float | |
| avg_bpm | Float | |
| max_bpm | Float | |
| resting_bpm | Float? | |
| created_at | DateTime | default: now() |

**Relations** : User, SessionExercise[]

---

### SessionExercise

Clé primaire composite : `(session_id, exercise_id)`

| Champ | Type | Notes |
|---|---|---|
| session_id | Int | FK → Session (Cascade) |
| exercise_id | Int | FK → Exercise (Cascade) |

---

### Exercise

| Champ | Type | Notes |
|---|---|---|
| id | Int PK | |
| name | String | Unique |
| primary_muscles | Json? | |
| secondary_muscles | Json? | |
| level | String? | |
| mechanic | String? | |
| equipment | String? | |
| category | String? | |
| exercise_type | String? | |
| instructions | Json? | |
| image_urls | Json? | |

**Relations** : SessionExercise[]

---

### Nutrition

| Champ | Type | Notes |
|---|---|---|
| id | Int PK | |
| name | String | Unique composite (name + category) |
| category | String | |
| calories_kcal | Float | |
| protein_g | Float | |
| carbohydrates_g | Float | |
| fat_g | Float | |
| fiber_g | Float | |
| sugar_g | Float | |
| sodium_mg | Float | |
| cholesterol_mg | Float | |
| water_intake_ml | Float | |
| meal_type_name | String? | |
| picture_url | String? | |

**Relations** : Meal[]

---

### Meal

| Champ | Type | Notes |
|---|---|---|
| id | Int PK | |
| user_id | Int | FK → User (Cascade) |
| nutrition_id | Int | FK → Nutrition (Cascade) |
| created_at | DateTime | |

**Relations** : User, Nutrition

---

### Plan

| Champ | Type | Notes |
|---|---|---|
| id | Int PK | |
| name | String | ex: "Freemium", "Premium", "Premium+", "B2B" |
| price | Float | |
| features | Json | |

**Relations** : Subscription[]

---

### Subscription

| Champ | Type | Notes |
|---|---|---|
| id | Int PK | |
| user_id | Int | FK → User (Cascade) |
| plan_id | Int | FK → Plan (Cascade) |
| start_date | DateTime | |
| end_date | DateTime | |
| status | String | ex: "ACTIVE", "active", "true" |

**Relations** : User, Plan

Statuts actifs définis dans `src/utils/constants.ts` : `['ACTIVE', 'active', 'true']`

---

### Post

| Champ | Type | Notes |
|---|---|---|
| id | Int PK | |
| author_id | Int | FK → User (Cascade) |
| organization_id | Int? | FK → Organization (SetNull) |
| title | String | |
| content | LongText | |
| media_url | VarChar(2048)? | |
| is_published | Boolean | default: false |
| created_at / updated_at | DateTime | Audit |

**Relations** : User (author), Organization

---

## Tables Staging (ETL)

Trois tables de staging avec la même structure :

`NutritionStaging` · `ExerciseStaging` · `HealthProfileStaging`

| Champ | Type | Notes |
|---|---|---|
| id | String PK | UUID |
| cleaned_data | Json | Données nettoyées par le pipeline |
| anomalies | Json | Anomalies détectées (`[]` si aucune) |
| status | Enum | `PENDING` \| `APPROVED` \| `REJECTED` |
| created_at / updated_at | DateTime | Audit |

Index sur le champ `status`.

**Flux** : les pipelines ETL écrivent uniquement dans ces tables. La validation humaine via le back-office approuve ou rejette chaque ligne avant insertion dans les tables finales.

---

## Diagramme des relations (simplifié)

```
Organization ──< User >── Role
                  │
         ┌────────┼────────────┐
         │        │            │
    HealthProfile  Session    Meal
                  │            │
           SessionExercise   Nutrition
                  │
              Exercise

User ──< Subscription >── Plan
User ──< Post >── Organization
```
