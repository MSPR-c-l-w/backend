# Skill : create-ticket

Crée des tickets GitHub sur les dépôts de l'organisation `MSPR-c-l-w`. Supporte deux modes selon les arguments fournis.

Arguments reçus : `$ARGUMENTS`

---

## Détection du mode

Analyse `$ARGUMENTS` pour choisir le mode :

- **Aucun argument** ou **texte court** (< 120 caractères, pas un chemin de fichier) → **Mode rapide** : créer un seul ticket interactivement
- **Chemin vers un fichier** (`.pdf`, `.png`, `.jpg`, `.webp`, `.md`, `.txt`) → **Mode document** : analyser le fichier, créer EPICs + tickets
- **URL** (commence par `http`) → **Mode URL** : si l'URL contient `figma.com` c'est une maquette, sinon tenter de récupérer le contenu avec WebFetch, puis Mode document
- **Flag `--epic`** présent dans les arguments → forcer la création d'un EPIC (dans n'importe quel mode)

---

## MODE RAPIDE — Un ticket à la volée

### Collecte des informations

Demande uniquement les informations manquantes :

1. **Dépôt cible** — choix entre :
   - `MSPR-c-l-w/backend`
   - `MSPR-c-l-w/social-media`
2. **Titre** — phrase courte et claire
3. **Type** :
   - `epic` — grande fonctionnalité regroupant plusieurs tickets
   - `enhancement` — nouvelle fonctionnalité
   - `bug` — quelque chose ne fonctionne pas
   - `documentation` — amélioration de la doc
   - `question` — besoin de clarification
4. **Module concerné** (optionnel) — ex: `auth`, `etl`, `session`, `post`, `nutrition`
5. **Description** — contexte, critères d'acceptance ou étapes pour reproduire
6. **EPIC parent** (optionnel, si le type n'est pas `epic`) — numéro d'une issue existante de type EPIC

### Formatage du body

Pour un ticket **standard** :

```markdown
## Description

<description>

## Module

<module si précisé>

## Critères d'acceptance

- [ ] <critère 1>
- [ ] <critère 2>

## EPIC parent

Part of #<numéro epic si fourni>
```

Pour un **EPIC** :

```markdown
## Objectif

<description de la fonctionnalité de haut niveau>

## Tickets liés

<!-- Liste mise à jour au fur et à mesure de la création des tickets enfants -->

- [ ] <!-- #numéro - titre -->

## Critères d'acceptance globaux

- [ ] <critère 1>
```

### Création via gh CLI

```bash
gh issue create \
  --repo <dépôt> \
  --title "<titre>" \
  --body "$(cat <<'EOF'
<body formaté>
EOF
)" \
  --label "<label>"
```

Pour un EPIC, utilise `--label "epic"`. Pour un ticket standard, utilise le label correspondant au type choisi.

### Ajout au GitHub Project

Après création, tente d'ajouter l'issue au projet via GraphQL :

```bash
# 1. Récupérer le nodeId de l'issue créée
ISSUE_NODE_ID=$(gh api repos/MSPR-c-l-w/<repo>/issues/<number> --jq '.node_id')

# 2. Récupérer l'ID du projet
gh api graphql -f query='
  query {
    organization(login: "MSPR-c-l-w") {
      projectsV2(first: 10) {
        nodes { id number title }
      }
    }
  }
'

# 3. Ajouter l'issue au projet
gh api graphql -f query='
  mutation($project: ID!, $item: ID!) {
    addProjectV2ItemById(input: { projectId: $project, contentId: $item }) {
      item { id }
    }
  }
' -f project="<PROJECT_ID>" -f item="$ISSUE_NODE_ID"
```

Si GraphQL échoue avec `INSUFFICIENT_SCOPES`, affiche :

> **Note :** Ticket créé avec succès. Pour l'ajouter automatiquement au GitHub Project, exécute une fois : `gh auth refresh -s project`

---

## MODE DOCUMENT — Analyse et création en lot

### Étape 1 — Lire le document

Selon le type d'argument :

- **Fichier PDF ou texte** : utilise l'outil `Read` pour lire le contenu du fichier fourni en argument
- **Image** (`.png`, `.jpg`, `.webp`) : utilise l'outil `Read` pour visualiser l'image (Claude est multimodal)
- **URL Figma** : récupère le contenu avec WebFetch si accessible, sinon demande à l'utilisateur de décrire les sections de la maquette
- **Autre URL** : utilise WebFetch pour récupérer le contenu

### Étape 2 — Analyser l'état existant

Exécute ces commandes en parallèle pour comprendre ce qui existe déjà :

```bash
# Issues existantes
gh issue list --repo MSPR-c-l-w/backend --limit 100 --json number,title,labels,state
gh issue list --repo MSPR-c-l-w/social-media --limit 100 --json number,title,labels,state

# Structure du code backend (modules)
ls src/ 2>/dev/null || true

# Commits récents pour comprendre ce qui a été livré
git log --oneline -20
```

Pour le dépôt `social-media`, liste aussi les fichiers si accessible :

```bash
gh api repos/MSPR-c-l-w/social-media/contents 2>/dev/null | jq '.[].name' || true
```

### Étape 3 — Identifier les EPICs et tickets

À partir du document analysé et de l'état existant, produis un **plan structuré** :

```
EPIC 1 : <Titre de la grande fonctionnalité>
  Dépôt : backend | social-media | les deux
  ├── Ticket 1.1 : <titre>  [enhancement|bug|documentation]
  ├── Ticket 1.2 : <titre>  [enhancement]
  └── Ticket 1.3 : <titre>  [enhancement]

EPIC 2 : <Titre>
  Dépôt : backend
  ├── Ticket 2.1 : <titre>  [enhancement]
  └── Ticket 2.2 : <titre>  [bug]
```

**Règles de déduplication :**

- Si une issue existante couvre déjà un sujet identifié, note-le dans le plan avec "✓ Existant : #<numéro>" et ne crée pas de doublon
- Si une fonctionnalité est partiellement couverte, crée un ticket complémentaire en précisant "Complète #<numéro>"

**Règles de répartition :**

- Fonctionnalités API, base de données, ETL, auth → `backend`
- Interface utilisateur, composants, pages → `social-media` ou `frontend`
- Fonctionnalités transverses → créer un ticket par dépôt concerné

### Étape 4 — Confirmer avec l'utilisateur

Affiche le plan complet et demande :

> Voici le plan de tickets. Veux-tu :
>
> 1. Créer tous les tickets tels quels
> 2. Modifier certains EPICs ou tickets avant de créer
> 3. Sélectionner uniquement certains EPICs

N'exécute rien avant validation explicite.

### Étape 5 — Création en lot

Pour chaque EPIC (dans l'ordre), puis pour chaque ticket enfant :

1. Crée l'EPIC en premier (label `epic`)
2. Note le numéro de l'issue créée
3. Crée les tickets enfants avec référence `Part of #<numéro epic>` dans le body
4. Met à jour le body de l'EPIC avec la checklist des tickets créés :

```bash
gh issue edit <epic-number> --repo MSPR-c-l-w/<repo> --body "<body mis à jour avec checklist>"
```

5. Tente d'ajouter chaque issue au GitHub Project via GraphQL (voir Mode rapide)

### Étape 6 — Rapport final

Affiche un tableau récapitulatif :

```
EPIC créés :
  #1  [backend]       Titre de l'EPIC 1
  #5  [social-media]  Titre de l'EPIC 2

Tickets créés :
  #2  [backend]       Titre ticket 1.1  → EPIC #1
  #3  [backend]       Titre ticket 1.2  → EPIC #1
  #4  [backend]       Titre ticket 1.3  → EPIC #1
  #6  [social-media]  Titre ticket 2.1  → EPIC #5

Tickets ignorés (déjà existants) :
  ✓   [backend]       Fonctionnalité X  → Issue existante #<n>

GitHub Project : ajouté ✓ | scope project manquant (gh auth refresh -s project)
```
