# ADR-001 : Choix de NestJS comme Framework Principal

**Status:** Accepted  
**Date:** 2026-05-29  
**Décideur:** Architecture Team

---

## Context

Besoin de choisir un framework Node.js pour construire une API REST scalable et maintenable avec les exigences suivantes :

- Support natif de TypeScript
- Architecture modulaire et structurée
- Décorateurs et metadonnées (reflection)
- Écosystème riche (authentification, validation, documentation API)
- Communauté active et documentation complète
- Performance et scalabilité

### Alternatives considérées

| Framework   | Pros                                   | Cons                                  |
| ----------- | -------------------------------------- | ------------------------------------- |
| **Express** | Minimaliste, flexible                  | Peu de structure, trop bas-niveau     |
| **Fastify** | Très rapide, async-first               | Écosystème moins riche                |
| **Hapi**    | Robuste, plugins                       | Moins populaire, courbe apprentissage |
| **NestJS**  | TypeScript-first, structuré, modulaire | Overhead initial                      |

---

## Decision

**Utiliser NestJS v11 comme framework principal.**

### Justification

1. **TypeScript first** : Support natif, décorateurs, types stricts
2. **Architecture modulaire** : Modules, services, controllers = code organisé et testable
3. **Dépendances intégrées** :
   - Validation : `class-validator`, `class-transformer`
   - Authentification : `@nestjs/passport`, `@nestjs/jwt`
   - Documentation : `@nestjs/swagger` (Swagger/OpenAPI)
   - WebSocket : `@nestjs/websockets`, Socket.IO
   - Scheduling : `@nestjs/schedule` (cron jobs)
4. **Testing natif** : Jest intégré avec support mocking
5. **ORM intégration** : Prisma compatible, pas de perte de flexibilité
6. **Communauté** : ~50k stars GitHub, nombreuses ressources

### Patterns adoptés

- **Modules** : Encapsulation par domaine métier
- **Dependency Injection** : NestJS DI container pour loose coupling
- **Guards & Interceptors** : Pour authentification, CORS, logging
- **Exception Filters** : Gestion centralisée des erreurs
- **Pipes & Decorators** : Validation et transformation de données

---

## Consequences

### Positives

✅ Code hautement structuré et maintenable  
✅ Équipe rapidement productive grâce à la structure claire  
✅ Écosystème complet réduit dépendances externes  
✅ Excellent support TypeScript et tooling (ESLint, tests)  
✅ Scaling horizontal simple (stateless architecture)

### Negatives

❌ Overhead initial (setup, boilerplate)  
❌ Courbe apprentissage pour les nouveaux (patterns NestJS)  
❌ Taille du bundle légèrement plus grande qu'Express minimaliste  
❌ Require Node.js 16+ (pas compatible anciennes versions)

---

## Alternatives rejetées

- **Express** : Trop basique, pas de structure → code spaghetti à grande échelle
- **Fastify** : Performant mais écosystème moins complet (authentification, validation)
- **Hapi** : Overkill pour notre cas, plugins moins accessibles

---

## Voir aussi

- [ADR-002 : MariaDB + Prisma](ADR-002-mariadb-prisma.md)
- [Architecture Système](../README.md)
- [@nestjs/common documentation](https://docs.nestjs.com/)
