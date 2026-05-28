# Gestion des secrets (#130)

## Fichiers de configuration

| Fichier                | Versionné       | Rôle                                                                       |
| ---------------------- | --------------- | -------------------------------------------------------------------------- |
| `.env.example`         | Oui             | Référence exhaustive (toutes les variables, format, obligatoire/optionnel) |
| `.env.secrets.example` | Oui             | Modèle des **secrets** uniquement                                          |
| `.env`                 | Non (gitignore) | Config non sensible locale                                                 |
| `.env.secrets`         | Non (gitignore) | Secrets locaux / Docker `env_file`                                         |

### Démarrage local

```bash
cp .env.example .env
cp .env.secrets.example .env.secrets
# Éditer .env.secrets avec de vraies valeurs (ne jamais committer)
```

L'application charge `.env` puis `.env.secrets` via `src/config/load-env.ts` (avant le bootstrap NestJS).

## Docker Compose — séparation sensible / secrets

Réseaux `healthai-internal` / `healthai-public` : voir [network.md](network.md).

Dans `docker-compose.yml` :

- **`env_file: .env.secrets`** — mots de passe, JWT, clés API, `DATABASE_URL`
- **`environment:`** — ports, noms de services, `NODE_ENV` (non secrets)

Les secrets ne doivent **pas** apparaître en clair dans le fichier `docker-compose.yml` versionné.

### Vérifier qu'aucun secret n'est dans le manifeste Compose

```bash
docker compose -f docker-compose.yml config
```

La sortie ne doit pas contenir de mots de passe réels issus du dépôt Git (seulement des références ou des valeurs de dev depuis votre `.env.secrets` local).

### `docker inspect` et variables d'environnement

Les variables chargées via `env_file` sont visibles dans `docker inspect <conteneur>` au **runtime** (limitation Docker : l'env du processus contient les secrets).

**Bonnes pratiques :**

- Ne jamais committer `.env.secrets`
- En production : préférer un gestionnaire de secrets (Vault, AWS Secrets Manager, variables chiffrées CI/CD) plutôt que des fichiers plats sur le serveur
- Ne pas logger `process.env` ni les URLs contenant des mots de passe

## Hook pre-commit anti-secrets

Deux mécanismes complémentaires :

1. **Husky** (par défaut) : `npm run secrets:scan` via `scripts/check-staged-secrets.mjs` sur les fichiers stagés
2. **detect-secrets** (optionnel) : `pip install pre-commit detect-secrets && pre-commit install`

En CI : scan **Gitleaks** (binaire open source via `scripts/ci-gitleaks.sh`, workflow `ci-quality.yml`). Pour les dépôts d’organisation, éviter `gitleaks-action@v2` qui exige une licence `GITLEAKS_LICENSE`.

## Rotation de `JWT_SECRET`

Procédure pour invalider tous les access tokens existants et basculer sur une nouvelle clé.

### 1. Générer une nouvelle clé

```bash
openssl rand -base64 48
```

### 2. Mettre à jour les secrets

- Local : remplacer `JWT_SECRET` dans `.env.secrets`
- Docker : mettre à jour `.env.secrets` sur l'hôte puis recréer les conteneurs
- Production : mettre à jour le secret dans le vault / les variables d'environnement du déploiement

### 3. Redéployer le backend

```bash
docker compose -f docker-compose.yml up -d --build backend
# ou votre pipeline CD habituel
```

Toutes les instances doivent redémarrer avec la **même** nouvelle valeur.

### 4. Invalidation des tokens

- Tous les **access tokens JWT** signés avec l'ancienne clé deviennent **invalides** immédiatement
- Les utilisateurs doivent se **reconnecter** (`POST /auth/login`) ou utiliser un **refresh token** valide pour obtenir un nouvel access token
- Les **refresh tokens** en base (hash SHA256) restent valides tant qu'ils n'ont pas expiré — seule la signature JWT change

### 5. Communication

Prévoir une fenêtre de maintenance ou accepter des déconnexions massives si la rotation est urgente (compromission).

### 6. Vérification post-rotation

```bash
# Ancien token → 401 Unauthorized
curl -H "Authorization: Bearer <ancien_access_token>" http://localhost:3001/users/me

# Nouvelle connexion → nouveau token valide
curl -X POST http://localhost:3001/auth/login -H "Content-Type: application/json" \
  -d '{"email":"...","password":"..."}'
```

## Références

- [environment.md](environment.md) — tableau des variables
- [security.md](security.md) — JWT, CSRF, hachage des tokens
