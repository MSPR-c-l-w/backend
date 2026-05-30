# Gestion mémoire Node.js — HealthAI Coach Backend

## Pourquoi la mémoire est un enjeu sur ce projet

NestJS embarque un runtime Node.js V8 dont la limite de heap par défaut est **environ 60MB sur macOS** (contre ~1.5GB sur Linux 64-bit). Avec le client Prisma, les modules NestJS chargés, le registre prom-client et les connexions WebSocket, le backend consomme ~57MB au repos, soit **96% de la limite** — une situation propice aux crashs OOM (`JavaScript heap out of memory`).

---

## Comportement par défaut de V8

| Environnement | Limite heap par défaut  | Heap NestJS au repos | Ratio  |
|---------------|-------------------------|----------------------|--------|
| macOS ARM/x64 | ~60 MB                  | ~57 MB               | **96%** |
| Linux 64-bit  | ~1.5 GB                 | ~57 MB               | ~4%    |
| Linux ARM64   | ~512 MB                 | ~57 MB               | ~11%   |

La limite dépend de la RAM physique de la machine et de la version de Node.js (>= 18 : la limite a été ajustée mais reste basse sur macOS).

---

## Solution appliquée

### 1. Flag `--max-old-space-size`

```bash
node --max-old-space-size=512 dist/main.js
```

Force la limite du "old space" (old generation heap, où vivent les objets longévifs) à 512MB.

**Résultat :** le même volume de données reste en mémoire (~57MB) mais le ratio `utilisé/total` tombe à ~11%.

**Pourquoi 512MB ?** C'est un compromis raisonnable pour un serveur de dev/staging : assez large pour absorber les pics (pipeline ETL + plusieurs requêtes simultanées), assez petit pour ne pas asphyxier un MacBook.

Pour la production sur un serveur dédié (8GB+ RAM), augmenter à `2048` ou `4096`.

### 2. Flag `--expose-gc`

```bash
node --max-old-space-size=512 --expose-gc dist/main.js
```

Expose la fonction `global.gc()` normalement inaccessible dans Node.js. **Sans ce flag, appeler `global.gc()` dans le code lève une exception.**

### 3. GC périodique dans `src/main.ts`

```typescript
// GC toutes les 30s si Node.js a été lancé avec --expose-gc
if (typeof global.gc === 'function') {
  setInterval(() => {
    global.gc!();
  }, 30_000);
}
```

Ce pattern déclenche explicitement un cycle de garbage collection toutes les 30 secondes. Le `typeof global.gc === 'function'` est un guard : si `--expose-gc` est absent (ex : environnement de CI), le code est silencieusement ignoré.

**Quand le GC est-il utile ?** Après un pipeline ETL qui crée de nombreux objets temporaires (arrays, records Prisma, réponses HTTP), V8 peut accumuler des objets non référencés mais pas encore collectés. Le GC forcé les libère avant le prochain pic.

---

## Configuration par environnement

### Développement (`npm run start:dev`)

Configuré via `nest-cli.json` :

```json
{
  "exec": "node --max-old-space-size=512 --expose-gc"
}
```

NestJS SWC/webpack utilisent la clé `exec` comme préfixe de commande pour lancer le process compilé.

### Production (`npm run start:prod`)

Configuré dans `package.json` :

```json
{
  "scripts": {
    "start:prod": "node --max-old-space-size=512 --expose-gc dist/main.js"
  }
}
```

### Docker (future containerisation du backend)

```dockerfile
ENV NODE_OPTIONS="--max-old-space-size=512 --expose-gc"
CMD ["node", "dist/main.js"]
```

---

## Surveillance en temps réel

### Via Prometheus + Grafana

Le dashboard **API NestJS** (http://localhost:3002) contient :

| Panel               | Métrique                                                  | Seuils                    |
|---------------------|-----------------------------------------------------------|---------------------------|
| Heap utilisé %      | `nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes * 100` | jaune 70%, rouge 85% |
| Heap used/total/RSS | timeseries des 3 valeurs                                  | —                         |
| GC duration         | `rate(nodejs_gc_duration_seconds_sum[2m])`                | par type (major/minor)    |

### Via CLI

```bash
# Heap actuel (en %)
curl -s "http://localhost:9090/api/v1/query?query=nodejs_heap_size_used_bytes/nodejs_heap_size_total_bytes*100" \
  | python3 -c "import json,sys; r=json.load(sys.stdin)['data']['result']; print(round(float(r[0]['value'][1]),1), '% heap utilisé')"

# Heap en bytes (directement)
curl -s http://localhost:3001/metrics | grep -E "^nodejs_heap_size_(used|total)_bytes [0-9]"

# Vérifier que --max-old-space-size est bien actif
ps aux | grep "node dist/main"
```

---

## Cycles de GC : major vs minor

| Type  | Alias       | Description                                         | Fréquence |
|-------|-------------|-----------------------------------------------------|-----------|
| Minor | Scavenge    | Collecte le "young space" (objets récents)          | Fréquente, rapide (~1ms) |
| Major | Mark-Sweep  | Collecte tout le heap y compris l'old space         | Rare, plus longue (~10-100ms) |
| Major | Mark-Compact| Comme Mark-Sweep + défragmentation mémoire          | Très rare |

Un major GC trop fréquent (> 1/min) est le signe d'une fuite mémoire ou d'un heap trop petit.

La métrique Prometheus `nodejs_gc_duration_seconds{gctype="major"}` mesure la durée de ces cycles.

---

## Recommandations pour la production

| Recommandation                         | Raison                                                   |
|----------------------------------------|----------------------------------------------------------|
| `--max-old-space-size=2048` sur serveur | Plus de marge pour les pics ETL simultanés              |
| Alerte Grafana heap > 85%              | Détecter les fuites avant le crash                       |
| `SIGTERM` géré dans `main.ts`          | Fermer Prisma proprement avant l'arrêt                   |
| Lancer avec PM2 ou systemd             | Redémarrage automatique sur crash OOM                    |
| Limiter les pipelines ETL parallèles   | Un seul ETL à la fois pour éviter les pics de mémoire   |
