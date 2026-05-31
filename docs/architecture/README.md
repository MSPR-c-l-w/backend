# Documentation Architecture Système

Bienvenue dans la documentation architecture système du backend TPRE601. Cette section couvre l'infrastructure, les décisions techniques, et la vision système du projet.

## 📚 Contenu

### 1. **[Diagrammes C4](01-diagrammes-c4.md)**

- Diagramme de contexte : vue système globale
- Diagramme de conteneurs : architecture des composants principaux
- Montrer les frontières, les interactions, et les dépendances externes

### 2. **[Infrastructure Docker Compose](02-infrastructure-docker.md)**

- Architecture des services locaux (développement et production)
- Configuration des conteneurs, volumes, networks
- Orchestration et dépendances inter-services
- Explication du Dockerfile multi-stage

### 3. **[Infrastructure Kubernetes](03-infrastructure-kubernetes.md)**

- Configuration pour déploiement en production (K8s)
- Deployments, Services, Ingress, ConfigMaps, Secrets
- Stratégies de scaling, haute disponibilité
- Health checks et liveness probes

### 4. **[Architecture Decision Records (ADRs)](04-adr/)**

Décisions techniques majeures et leurs justifications :

- **ADR-001** : Choix de NestJS comme framework
- **ADR-002** : MariaDB + Prisma vs PostgreSQL
- **ADR-003** : JWT pour l'authentification
- **ADR-004** : Socket.IO pour le temps réel
- **ADR-005** : Pattern ETL avec tables staging

### 5. **[Flux de Données](05-flux-donnees.md)**

- Flux API (request/response)
- Interactions avec la base de données
- Pipeline ETL (import, nettoyage, validation, insertion)
- WebSocket events (notifications temps réel)
- Authentification et autorisation (JWT flow)

### 6. **[Réseau et Sécurité](06-reseau-securite.md)**

- Ports exposés et services accessibles
- Communication inter-services
- TLS/SSL et HTTPS
- Authentification JWT
- CORS et sécurité Cross-Origin
- CSRF et protections additionnelles
- Variables d'environnement sensibles

### 7. **[Glossaire](07-glossaire.md)**

- Termes métier du domaine fitness/santé
- Termes techniques et acronymes
- Définitions des modèles et entités principales

---

## 🔗 Références croisées

- **Documentation domaine métier** : [`documentation/`](../../documentation/)
- **Guide développeur** : [`CLAUDE.md`](../../CLAUDE.md) et [`AGENTS.md`](../../AGENTS.md)
- **README principal** : [`README.md`](../../README.md)
- **Configuration Docker** : [`README.Docker.md`](../../README.Docker.md)

---

## 📐 Architecture globale

```
┌─────────────────────────────────────────────────┐
│ Clients (Web, Mobile, Admin Dashboard)          │
└──────────────────┬──────────────────────────────┘
                   │ HTTPS/WSS
                   ▼
┌─────────────────────────────────────────────────┐
│ Ingress / Load Balancer (K8s)                   │
└──────────────────┬──────────────────────────────┘
                   │
          ┌────────┴────────┐
          ▼                 ▼
    ┌──────────┐     ┌──────────────┐
    │ Backend  │     │ WebSocket    │
    │ API      │     │ Gateway      │
    │(NestJS)  │     │ (Socket.IO)  │
    └────┬─────┘     └──────┬───────┘
         │                  │
         └──────────┬───────┘
                    ▼
         ┌────────────────────┐
         │ MariaDB + Prisma   │
         │ (Base de données)  │
         └────────────────────┘

┌─────────────────────────────────────────────────┐
│ Services ETL, Analytics, Scheduled Tasks        │
│ (processus asynchrones)                         │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Déploiement

### Développement local

```bash
docker-compose up -d
npm run prisma:migrate
npm start:dev
```

### Production (Kubernetes)

```bash
kubectl apply -f k8s/
kubectl rollout status deployment/backend
```

---

## 📞 Contact et questions

Pour des questions sur l'architecture, consultez :

- Les ADRs pertinentes dans le dossier `04-adr/`
- La documentation domaine correspondante dans `documentation/`
- Les fichiers de configuration (`compose.yaml`, `Dockerfile`)
