# Skills Claude Code

Les skills sont des commandes slash personnalisées pour Claude Code, stockées dans `.claude/commands/`. Ils automatisent des tâches répétitives directement depuis l'éditeur.

## Prérequis

- [Claude Code](https://claude.ai/code) installé (CLI ou extension VS Code)
- [GitHub CLI (`gh`)](https://cli.github.com/) authentifié : `gh auth login`
- Scope `project` recommandé pour l'intégration GitHub Projects :

```bash
gh auth refresh -s project
```

---

## `/create-ticket` — Créer des tickets GitHub

Crée des issues sur les dépôts `MSPR-c-l-w/backend` et `MSPR-c-l-w/social-media`. Supporte deux modes.

### Mode rapide — un ticket à la volée

```
/create-ticket
```

Ou avec une description directe :

```
/create-ticket Le calcul des calories est incorrect dans session/today/summary
```

L'assistant pose les questions manquantes (dépôt, type, module, description) puis crée le ticket immédiatement.

Pour créer un **EPIC** directement :

```
/create-ticket --epic Gestion de l'authentification OAuth2
```

---

### Mode document — cahier des charges, PDF, maquette Figma

Passe un fichier ou une URL en argument. Claude analyse le document, identifie les grandes fonctionnalités, et propose un plan structuré en EPICs et tickets avant de créer quoi que ce soit.

**Depuis un PDF (cahier des charges, specs d'examen) :**

```
/create-ticket /chemin/vers/cahier-des-charges.pdf
```

**Depuis une image (maquette exportée) :**

```
/create-ticket /chemin/vers/maquette.png
```

**Depuis une URL Figma ou une spec en ligne :**

```
/create-ticket https://www.figma.com/file/...
```

#### Ce que fait le mode document

1. **Lit le document** (PDF, image, URL) via les outils Claude multimodaux
2. **Analyse l'existant** — inspecte les issues déjà ouvertes sur les deux repos et l'état du code pour éviter les doublons
3. **Propose un plan** — liste des EPICs et tickets enfants, répartis par dépôt, avec déduplication des fonctionnalités déjà couvertes
4. **Attend ta validation** avant de créer quoi que ce soit
5. **Crée en lot** — EPICs d'abord, puis tickets enfants référençant leur EPIC
6. **Met à jour les EPICs** avec la checklist des tickets créés
7. **Ajoute au GitHub Project** si le scope `project` est disponible

#### Exemple de plan généré

```
EPIC 1 : Authentification & Gestion des accès
  Dépôt : backend
  ├── Ticket 1.1 : Implémenter l'inscription utilisateur            [enhancement]
  ├── Ticket 1.2 : Ajouter la vérification d'email                 [enhancement]
  └── Ticket 1.3 : Mettre en place la rotation des refresh tokens  [enhancement]

EPIC 2 : Feed social et publications
  Dépôt : social-media
  ├── Ticket 2.1 : Créer le composant FeedPost                     [enhancement]
  └── Ticket 2.2 : Intégrer la pagination infinie                  [enhancement]

✓ Déjà existant : Fonctionnalité X → Issue #3 (ignorée)
```

---

### Types de tickets et labels GitHub

| Type                    | Label appliqué  | Usage                                              |
| ----------------------- | --------------- | -------------------------------------------------- |
| EPIC                    | `epic`          | Grande fonctionnalité regroupant plusieurs tickets |
| Nouvelle fonctionnalité | `enhancement`   | Ajout de comportement                              |
| Bug                     | `bug`           | Quelque chose ne fonctionne pas                    |
| Documentation           | `documentation` | Mise à jour de la doc                              |
| Question                | `question`      | Besoin de clarification                            |

### Structure d'un EPIC

Un EPIC est une issue GitHub labelisée `epic`. Les tickets enfants référencent leur EPIC dans leur body avec `Part of #<numéro>`. Après création de tous les enfants, l'EPIC est mis à jour avec une checklist :

```markdown
## Tickets liés

- [ ] #2 Implémenter l'inscription utilisateur
- [ ] #3 Ajouter la vérification d'email
- [ ] #4 Mettre en place la rotation des refresh tokens
```

---

### Intégration GitHub Projects

Le skill tente d'ajouter chaque issue créée au GitHub Project de l'organisation `MSPR-c-l-w`. Cette fonctionnalité nécessite le scope `project` :

```bash
gh auth refresh -s project
```

Sans ce scope, les issues sont créées normalement sur les dépôts — seul l'ajout au project board est ignoré.

---

## Ajouter d'autres skills

Créez un fichier `.claude/commands/<nom>.md`. Le contenu est le prompt que Claude suit quand vous tapez `/<nom>`.

```
.claude/
└── commands/
    ├── create-ticket.md    # /create-ticket
    └── mon-skill.md        # /mon-skill
```

Utilisez `$ARGUMENTS` dans le fichier pour récupérer ce que l'utilisateur a tapé après le nom de la commande.
