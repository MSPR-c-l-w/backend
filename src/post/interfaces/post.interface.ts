import type { Request } from 'express';
import { Post } from '@prisma/client';
import type { CreatePostDto, UpdatePostDto } from 'src/post/dtos/post.dto';

export interface IPostController {
  getPosts(): Promise<Post[]>;
  getPostById(id: string): Promise<Post>;
  createPost(dto: CreatePostDto): Promise<Post>;
  updatePost(id: string, dto: UpdatePostDto): Promise<Post>;
  deletePost(id: string, req: Request): Promise<Post>;
}

export interface IPostService {
  getPosts(): Promise<Post[]>;
  getPostById(id: string): Promise<Post>;
  createPost(dto: CreatePostDto): Promise<Post>;
  updatePost(id: string, dto: UpdatePostDto): Promise<Post>;
  deletePost(id: string, requesterUserId: number): Promise<Post>;
}
