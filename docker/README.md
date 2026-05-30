# Monitoring — Guide de démarrage

## Prérequis

- Docker et Docker Compose installés
- Se placer dans le dossier `docker/` du backend

```bash
cd docker
```

---

## Démarrer la stack

```bash
docker compose -f docker-compose.monitoring.yml up -d
```

---

## Accès aux interfaces

| Service | URL | Identifiants |
|---------|-----|--------------|
| **Grafana** (dashboards) | http://localhost:3001 | admin / admin |
| **Prometheus** (métriques) | http://localhost:9090 | — |
| **AlertManager** (alertes) | http://localhost:9093 | — |
| **cAdvisor** (conteneurs) | http://localhost:8081 | — |

> Les 3 dashboards Grafana (**Stack Overview**, **API NestJS**, **AI Services**) sont disponibles dès le démarrage dans **Dashboards → HealthAI Coach**.

---

## Arrêter la stack

```bash
docker compose -f docker-compose.monitoring.yml down
```

## Voir les logs

```bash
docker compose -f docker-compose.monitoring.yml logs -f
```

## Redémarrer un service

```bash
docker compose -f docker-compose.monitoring.yml restart prometheus
```

---

> Documentation complète : [`../documentation/monitoring.md`](../documentation/monitoring.md)
