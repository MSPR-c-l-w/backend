import type { Request } from 'express';
import { Post } from '@prisma/client';
import type {
  CreatePostCommentDto,
  CreatePostDto,
  GetPostCommentsQueryDto,
  GetPostsQueryDto,
  UpdatePostDto,
} from 'src/post/dtos/post.dto';
import type {
  PaginatedPostComments,
  PostCommentWithAuthor,
  PostWithEngagement,
} from 'src/post/types/post-engagement.types';

export interface IPostController {
  getPosts(
    req: Request,
    query: GetPostsQueryDto,
  ): Promise<PostWithEngagement[]>;
  getPostById(id: string, req: Request): Promise<PostWithEngagement>;
  getPostComments(
    id: string,
    query: GetPostCommentsQueryDto,
  ): Promise<PaginatedPostComments>;
  createPostComment(
    id: string,
    dto: CreatePostCommentDto,
    req: Request,
  ): Promise<PostCommentWithAuthor>;
  deleteComment(id: string, commentId: string, req: Request): Promise<void>;
  likePost(
    id: string,
    req: Request,
  ): Promise<{ likes_count: number; liked_by_me: boolean }>;
  unlikePost(
    id: string,
    req: Request,
  ): Promise<{ likes_count: number; liked_by_me: boolean }>;
  createPost(dto: CreatePostDto): Promise<Post>;
  updatePost(id: string, dto: UpdatePostDto): Promise<Post>;
  deletePost(id: string, req: Request): Promise<Post>;
}

export interface IPostService {
  getPosts(
    currentUserId: number,
    cursor?: number,
    limit?: number,
    category?: string,
  ): Promise<PostWithEngagement[]>;
  getPostById(id: string, currentUserId: number): Promise<PostWithEngagement>;
  getPostComments(
    id: string,
    page: number,
    limit: number,
  ): Promise<PaginatedPostComments>;
  createPostComment(
    id: string,
    content: string,
    userId: number,
    parentId?: number,
  ): Promise<PostCommentWithAuthor>;
  deleteComment(
    postId: string,
    commentId: string,
    userId: number,
  ): Promise<void>;
  likePost(
    id: string,
    userId: number,
  ): Promise<{ likes_count: number; liked_by_me: boolean }>;
  unlikePost(
    id: string,
    userId: number,
  ): Promise<{ likes_count: number; liked_by_me: boolean }>;
  createPost(dto: CreatePostDto): Promise<Post>;
  updatePost(id: string, dto: UpdatePostDto): Promise<Post>;
  deletePost(id: string, requesterUserId: number): Promise<Post>;
}
