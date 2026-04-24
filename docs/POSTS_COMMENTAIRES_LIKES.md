# Posts : commentaires et likes

## Rôle

Les utilisateurs authentifiés peuvent **commenter** et **liker** des publications. Un utilisateur ne peut liker un même post qu’**une seule fois** (contrainte unique en base).

## Modèle de données (Prisma)

- **`PostComment`** : `post_id`, `user_id`, `content` (max 4000 caractères), `parent_id` (optionnel, auto-référence pour **répondre à un commentaire**), `created_at`, `updated_at`. Suppression en cascade si le post, l’utilisateur ou le commentaire parent est supprimé.
- **`PostLike`** : `post_id`, `user_id`, `created_at`. Contrainte **`@@unique([post_id, user_id])`** pour éviter les doublons.

Migrations : `20260424120000_post_comments_likes` (tables), `20260424220000_post_comment_parent` (colonne `parent_id` + FK).

## API (NestJS)

Toutes les routes sous **`/posts`** exigent un **JWT** valide et un rôle autorisé (comme le reste du module posts).

### Lecture du fil avec compteurs

| Méthode | Route | Description |
|--------|--------|-------------|
| `GET` | `/posts` | Liste des posts avec **`likes_count`**, **`comments_count`**, **`liked_by_me`** (par rapport au `sub` du JWT). |
| `GET` | `/posts/:id` | Détail d’un post avec les mêmes champs d’engagement. |

Les champs classiques du modèle `Post` sont inchangés ; les trois champs ci-dessus s’ajoutent à la réponse JSON.

### Commentaires

| Méthode | Route | Corps | Description |
|--------|--------|--------|-------------|
| `GET` | `/posts/:id/comments` | — | Liste **plate** de tous les commentaires du post (ordre chronologique), chaque entrée inclut **`parent_id`** (`null` = racine, sinon id du commentaire auquel on répond). |
| `POST` | `/posts/:id/comments` | `{ "content": "...", "parent_id"?: 12 }` | Crée un commentaire racine ou une **réponse** ; `parent_id` doit désigner un commentaire **déjà sur ce post**. Sinon : `400 POST_COMMENT_PARENT_NOT_FOUND_OR_WRONG_POST`. Auteur = `sub` du JWT. |

### Likes

| Méthode | Route | Description |
|--------|--------|-------------|
| `POST` | `/posts/:id/like` | Ajoute un like. **Idempotent** : un second appel ne provoque pas d’erreur si le like existe déjà. |
| `DELETE` | `/posts/:id/like` | Retire le like de l’utilisateur connecté. |

Réponse typique après like / unlike :

```json
{ "likes_count": 12, "liked_by_me": true }
```

## Fichiers utiles côté code

- Schéma : `prisma/schema.prisma` (`PostComment`, `PostLike`).
- Types de réponse : `src/post/types/post-engagement.types.ts`.
- DTO commentaire : `src/post/dtos/post.dto.ts` (`CreatePostCommentDto`).
- Logique : `src/post/services/post/post.service.ts`.
- Routes : `src/post/controllers/post/post.controller.ts` (ordre des routes : `:id/comments` et `:id/like` avant `GET :id`).

## En cas de problème

- Appliquer les migrations : `npx prisma migrate deploy` (ou `migrate dev` en local).
- Régénérer le client : `npx prisma generate`.
