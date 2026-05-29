import type { Request } from 'express';
import { Post } from '@prisma/client';
import type {
  CreatePostCommentDto,
  CreatePostDto,
  GetPostsQueryDto,
  UpdatePostDto,
} from 'src/post/dtos/post.dto';
import type {
  PostCommentWithAuthor,
  PostWithEngagement,
} from 'src/post/types/post-engagement.types';

export interface IPostController {
  getPosts(
    req: Request,
    query: GetPostsQueryDto,
  ): Promise<PostWithEngagement[]>;
  getPostById(id: string, req: Request): Promise<PostWithEngagement>;
  getPostComments(id: string): Promise<PostCommentWithAuthor[]>;
  createPostComment(
    id: string,
    dto: CreatePostCommentDto,
    req: Request,
  ): Promise<PostCommentWithAuthor>;
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
  getPostComments(id: string): Promise<PostCommentWithAuthor[]>;
  createPostComment(
    id: string,
    content: string,
    userId: number,
    parentId?: number,
  ): Promise<PostCommentWithAuthor>;
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
