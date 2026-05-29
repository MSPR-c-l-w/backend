# Architecture Decision Records (ADRs)

Documentation des décisions architecturales majeures du projet.

---

## 📋 Vue d'ensemble

Les ADRs documentent les **pourquoi** derrière nos choix technologiques et architecturaux. Chaque ADR explique :

- **Context** : Situation et exigences
- **Decision** : Choix effectué
- **Consequences** : Impacts (positifs et négatifs)
- **Alternatives** : Autres options considérées

---

## 📚 ADRs

### [ADR-001 : NestJS comme Framework Principal](ADR-001-nestjs.md)

**Status** : ✅ Accepted

Justification du choix de NestJS v11 pour la structure modulaire, TypeScript-first, et écosystème complet (validation, authentification, documentation API).

**Alternatives rejetées :** Express (trop minimaliste), Fastify (écosystème moins riche), Hapi.

---

### [ADR-002 : MariaDB + Prisma vs PostgreSQL](ADR-002-mariadb-prisma.md)

**Status** : ✅ Accepted

Justification du choix MariaDB 11 (performance, déploiement simple) avec Prisma ORM v7 (schema-driven, migrations auto-générées, DX excellent).

**Alternatives rejetées :** PostgreSQL (complexité), MongoDB (transactions limitées), TypeORM/Sequelize (moins bonne DX).

---

### [ADR-003 : JWT pour l'Authentification](ADR-003-jwt-auth.md)

**Status** : ✅ Accepted

Justification du JWT stateless avec refresh token rotation. Permet API scalable horizontalement, cross-domain, mobile-friendly.

**Pattern :** Access token court (15 min) + refresh token long (7 jours) avec rotation.

**Alternatives rejetées :** Sessions (stateful), OAuth (overkill), API Keys (pas de contexte user).

---

### [ADR-004 : Socket.IO pour le Temps Réel](ADR-004-socketio.md)

**Status** : ✅ Accepted

Justification de Socket.IO v4 pour notifications temps réel, broadcasts, et rooms. Intégration NestJS native, fallbacks automatiques.

**Pattern :** Namespaces (`/sessions`, `/nutrition`), rooms (`user:42`, `session:123`), authentication JWT.

**Alternatives rejetées :** WebSocket pur (pas de fallback), SSE (one-way), GraphQL subscriptions (complexité).

---

### [ADR-005 : Pattern ETL avec Tables Staging](ADR-005-etl-staging.md)

**Status** : ✅ Accepted

Justification du pattern ETL à 5 étapes (Extract → Transform → Staging → Review → Approve → Load). Garantit intégrité données, audit trail, et approbation humaine.

**Tables :** `NutritionStaging`, `ExerciseStaging`, `HealthProfileStaging` avec `status` (PENDING | APPROVED | REJECTED).

**Alternatives rejetées :** Direct insert (risque corruption), event-sourcing (overkill).

---

## 🔄 Évolution ADRs

### Créer une nouvelle ADR

1. **Identifier la décision** : Choix technologique majeur ou pattern architecture
2. **Créer fichier** : `ADR-NNN-titre-decision.md`
3. **Remplir template** : Context, Decision, Consequences, Alternatives
4. **Lier depuis README** : Ajouter entrée dans vue d'ensemble
5. **Référencer** : Dans diagrammes et docs pertinentes

### Template

```markdown
# ADR-NNN : Titre Décision

**Status:** Accepted / Proposed / Superseded by ADR-XXX  
**Date:** YYYY-MM-DD  
**Décideur:** Nom Team

---

## Context

[Situation et exigences]

### Alternatives considérées

[Table alternatives]

---

## Decision

**[Décision prise]**

### Justification

[Raisons]

---

## Consequences

### Positives

✅ [Impacts positifs]

### Negatives

❌ [Impacts négatifs]

---

## Alternatives rejetées

[Pourquoi autres options rejetées]

---

## Voir aussi

[Références croisées]
```

---

## 🔗 Références Croisées

**Diagrammes C4** : [01-diagrammes-c4.md](../01-diagrammes-c4.md)

**Infrastructure Docker** : [02-infrastructure-docker.md](../02-infrastructure-docker.md)

**Infrastructure Kubernetes** : [03-infrastructure-kubernetes.md](../03-infrastructure-kubernetes.md)

**Flux de Données** : [05-flux-donnees.md](../05-flux-donnees.md)

**Réseau & Sécurité** : [06-reseau-securite.md](../06-reseau-securite.md)

**Glossaire** : [07-glossaire.md](../07-glossaire.md)

---

## 📊 Matrice Décisions

| ADR | Domaine   | Status | Impact                   | Risque                     |
| --- | --------- | ------ | ------------------------ | -------------------------- |
| 001 | Framework | ✅     | Framework global         | Bas                        |
| 002 | Database  | ✅     | Data persistence         | Moyen (lock-in Prisma)     |
| 003 | Auth      | ✅     | Sécurité, Scalabilité    | Bas (standard JWT)         |
| 004 | Real-time | ✅     | Notifications temps réel | Bas (framework stable)     |
| 005 | ETL       | ✅     | Data quality             | Moyen (processus complexe) |

---

## ❓ FAQ ADRs

**Q: Quand créer une ADR ?**  
R: Lors d'une décision architecturale impactant plusieurs modules ou avec implications long-terme.

**Q: Qui approuve les ADRs ?**  
R: Architecture team (lead architect + tech leads).

**Q: Comment modifier une ADR acceptée ?**  
R: Créer nouvelle ADR marquant l'ancienne comme "Superseded by ADR-XXX".

**Q: Les ADRs sont-elles obligatoires pour tous les choix tech ?**  
R: Non, les choix mineurs (lib version, style) n'en nécessitent pas.
