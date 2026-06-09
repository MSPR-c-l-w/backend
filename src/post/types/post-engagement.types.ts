import type { Post } from '@prisma/client';

export type PostAuthor = {
  id: number;
  first_name: string;
  last_name: string;
};

export type PostWithEngagement = Post & {
  likes_count: number;
  comments_count: number;
  liked_by_me: boolean;
  author: PostAuthor;
};

export type PostCommentWithAuthor = {
  id: number;
  post_id: number;
  user_id: number;
  parent_id: number | null;
  content: string;
  created_at: Date;
  updated_at: Date;
  user: {
    id: number;
    first_name: string;
    last_name: string;
  };
};

export type PaginatedPostComments = {
  comments: PostCommentWithAuthor[];
  total: number;
  hasMore: boolean;
};

export type CommentLikeSummary = {
  likes_count: number;
  liked_by_me: boolean;
};
