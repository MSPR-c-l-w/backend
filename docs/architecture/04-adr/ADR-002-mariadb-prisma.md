# ADR-002 : MariaDB + Prisma vs PostgreSQL

**Status:** Accepted  
**Date:** 2026-05-29  
**Décideur:** Architecture Team

---

## Context

Sélectionner la base de données et l'ORM pour une plateforme fitness/santé avec :

- Millions de données (sessions, nutrition, exercices)
- Besoin de transactions ACID
- Queries complexes (analytics, agrégations)
- Évolution fréquente du schéma
- Performance critique (latence < 50ms pour la plupart des queries)

### Bases de données évaluées

| BD             | Avantages                                                      | Inconvénients                                          |
| -------------- | -------------------------------------------------------------- | ------------------------------------------------------ |
| **MariaDB 11** | Open source, fork MySQL stable, performant, déploiement simple | Moins de features avancées que PostgreSQL              |
| **PostgreSQL** | Features avancées (JSON, arrays, extensions), query planner    | Overhead ressources, configuration complexe            |
| **MongoDB**    | Flexible, no-schema                                            | NoSQL, transactions limitées, pas idéal pour analytics |

### ORMs évalués

| ORM           | Pros                                             | Cons                              |
| ------------- | ------------------------------------------------ | --------------------------------- |
| **Prisma**    | Schema-driven, migrations générées, DX excellent | Overhead runtime, moins flexible  |
| **TypeORM**   | Très flexible, décorateurs TypeScript            | Boilerplate, moins bien documenté |
| **Sequelize** | Ancien, stable                                   | Legacy, moins TypeScript-friendly |

---

## Decision

**Utiliser MariaDB 11 comme base de données avec Prisma ORM v7.**

### Justification

#### 1. MariaDB (vs PostgreSQL)

| Critère               | MariaDB                           | PostgreSQL                    |
| --------------------- | --------------------------------- | ----------------------------- |
| **Compatibilité**     | MySQL-compatible, migration aisée | Écosystème propriétaire       |
| **Performance**       | Excellent pour OLTP               | Meilleur pour OLAP / complexe |
| **Ressources**        | Léger, peu de RAM                 | Plus de ressources            |
| **Déploiement**       | Trivial (Docker, K8s)             | Idem mais config complexe     |
| **Coût opérationnel** | Faible                            | Moyen                         |

**Choix pragmatique :** MariaDB 11 offre stabilité, performance et simplicité opérationnelle sans sacrifier capacités pour notre domaine.

#### 2. Prisma (vs TypeORM, Sequelize)

| Critère           | Prisma                          | TypeORM             | Sequelize           |
| ----------------- | ------------------------------- | ------------------- | ------------------- |
| **Schema**        | Schema.prisma centralisé        | Décorateurs entités | Migrations séparées |
| **Migrations**    | Auto-générées                   | Manuel              | Manuel              |
| **TypeScript**    | Native first                    | Oui mais complexe   | Limited             |
| **DX**            | Excellent (prisma studio, etc.) | Bon                 | Ancien              |
| **Query builder** | Fluent API                      | QueryBuilder        | Modèle-centric      |

**Choix pragmatique :** Prisma réduit boilerplate, migrations auto-générées, meilleur DX, interface intuitive.

---

## Consequences

### Positives

✅ **Prisma Studio** : GUI pour explorer/editer données en développement  
✅ **Migrations auto-générées** : `prisma migrate dev` crée les migrations  
✅ **Type-safety** : Generated client types 100% TypeScript  
✅ **Performance** : Connection pooling, lazy loading, optimisation query  
✅ **Adapter MariaDB** : `@prisma/adapter-mariadb` pour native driver  
✅ **Scalabilité** : Horizontale simple (stateless API + DB master-slave)

### Negatives

❌ **Lock-in Prisma** : Migration vers autre ORM coûteuse  
❌ **Runtime overhead** : Prisma client = couche supplémentaire  
❌ **Limitations** : Certaines queries complexes nécessitent SQL raw  
❌ **Cold starts** : `prisma generate` requis après schéma change

---

## Schema Prisma Patterns

### Modèle User (exemple)

```prisma
model User {
  id                Int      @id @default(autoincrement())
  email             String   @unique
  password_hash     String
  first_name        String
  last_name         String
  refresh_token_hash String?
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt

  // Relations
  organization      Organization?
  healthProfile     HealthProfile?
  sessions          Session[]
  subscriptions     Subscription[]
}
```

### Staging ETL Pattern

```prisma
model NutritionStaging {
  id            String   @id @default(uuid())
  cleaned_data  Json     // { "meals": [...], "calories": 2500 }
  anomalies     Json     // { "errors": [...] }
  status        String   @default("PENDING") // PENDING | APPROVED | REJECTED
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt
}

model Nutrition {
  id            Int      @id @default(autoincrement())
  user_id       Int
  calories      Int
  proteins      Float
  carbs         Float
  fats          Float
  created_at    DateTime @default(now())
  user          User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
}
```

---

## Commandes Clés

```bash
# Générer client Prisma
npx prisma generate

# Créer migration (après changement schema)
npx prisma migrate dev --name add_user_field

# Deploy en production
npx prisma migrate deploy

# Ouvrir Prisma Studio (GUI)
npx prisma studio

# Seed database
npx prisma db seed
```

---

## Monitoring & Performance

### Queries lentes (Prisma Insights)

```bash
npx prisma db execute "SELECT * FROM _prisma_migrations;"
```

### Connection pooling

En production, utiliser PgBouncer (pour MariaDB) ou `@prisma/internals` pour pooling.

---

## Voir aussi

- [ADR-001 : NestJS](ADR-001-nestjs.md)
- [Database Documentation](../../documentation/database.md)
- [Infrastructure Docker](../02-infrastructure-docker.md)
- [Prisma Docs](https://www.prisma.io/docs/)
