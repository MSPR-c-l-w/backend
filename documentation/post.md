# Module Post

`src/post/`

## Rôle

Gestion des articles publiés sur la plateforme (blog / actualités). Les posts appartiennent à un auteur (User) et peuvent être rattachés à une organisation.

## Endpoints

| Méthode | Route | Guards | Description |
|---|---|---|---|
| GET | `/posts` | JWT (ADMIN/COACH/CLIENT) | Liste tous les posts |
| GET | `/posts/:id` | — | Détail d'un post |
| POST | `/posts` | — | Créer un post |
| PUT | `/posts/:id` | — | Mettre à jour un post |
| DELETE | `/posts/:id` | — | Supprimer (auteur ou ADMIN) |

## DTOs

### CreatePostDto
```typescript
title: string
content: string
media_url?: string       // max 2048 caractères
is_published?: boolean   // default: false
author_id: number
organization_id?: number
```

### UpdatePostDto
Tous les champs sont optionnels.

## Modèle de réponse

```json
{
  "id": 1,
  "title": "Nouveaux exercices disponibles",
  "content": "...",
  "media_url": "https://...",
  "is_published": true,
  "author_id": 5,
  "organization_id": 2,
  "created_at": "2026-05-14T10:00:00.000Z",
  "updated_at": "2026-05-14T10:00:00.000Z",
  "author": { "id": 5, "first_name": "Jean", "last_name": "Dupont" },
  "organization": { "id": 2, "name": "FitCorp" }
}
```

## Règles d'accès

- **Création / mise à jour** : aucun guard explicite (authentification implicite via `author_id`)
- **Suppression** : seul l'**auteur** ou un **ADMIN** peut supprimer le post. Sinon → `ForbiddenException`
- Si l'organisation liée est soft-deleted, `organization_id` est mis à `null` (SetNull en cascade Prisma)

## Tests requis

```typescript
describe('PostService', () => {
  describe('getPosts', () => {
    it('retourne tous les posts avec author et organization inclus')
  })
  describe('getPostById', () => {
    it('retourne le post si trouvé')
    it('lève NotFoundException si inexistant')
  })
  describe('createPost', () => {
    it('crée le post avec is_published: false par défaut')
    it('lève NotFoundException si author_id est invalide')
    it('lève NotFoundException si organization_id est invalide')
  })
  describe('updatePost', () => {
    it('met à jour les champs fournis')
    it('lève NotFoundException si post inexistant')
  })
  describe('deletePost', () => {
    it('supprime le post si l\'utilisateur est l\'auteur')
    it('supprime le post si l\'utilisateur est ADMIN')
    it('lève ForbiddenException si l\'utilisateur n\'est ni auteur ni ADMIN')
    it('lève NotFoundException si post inexistant')
  })
})
```
