import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Post, Prisma } from '@prisma/client';
import type { CreatePostDto, UpdatePostDto } from 'src/post/dtos/post.dto';
import { IPostService } from 'src/post/interfaces/post.interface';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';

@Injectable()
export class PostService implements IPostService {
  constructor(private readonly prisma: PrismaService) {}

  async getPosts(): Promise<Post[]> {
    return this.prisma.post.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  async getPostById(id: string): Promise<Post> {
    const postId = parseInt(id, 10);
    if (!Number.isInteger(postId)) {
      throw new BadRequestException('POST_ID_MUST_BE_A_NUMBER');
    }
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundException(`Post avec l'id ${id} introuvable`);
    }
    return post;
  }

  async createPost(dto: CreatePostDto): Promise<Post> {
    try {
      return await this.prisma.post.create({
        data: {
          title: dto.title,
          content: dto.content,
          media_url: dto.media_url ?? null,
          is_published: dto.is_published ?? false,
          author_id: dto.author_id,
          organization_id: dto.organization_id ?? null,
        },
      });
    } catch (e: unknown) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2003'
      ) {
        throw new BadRequestException('POST_AUTHOR_OR_ORGANIZATION_NOT_FOUND');
      }
      throw e;
    }
  }

  async updatePost(id: string, dto: UpdatePostDto): Promise<Post> {
    const postId = parseInt(id, 10);
    if (!Number.isInteger(postId)) {
      throw new BadRequestException('POST_ID_MUST_BE_A_NUMBER');
    }
    await this.getPostById(id);

    const data: Prisma.PostUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.content !== undefined) data.content = dto.content;
    if (dto.media_url !== undefined) {
      data.media_url = dto.media_url;
    }
    if (dto.is_published !== undefined) {
      data.is_published = dto.is_published;
    }
    if (dto.author_id !== undefined) {
      data.author = { connect: { id: dto.author_id } };
    }
    if (dto.organization_id !== undefined) {
      data.organization =
        dto.organization_id === null
          ? { disconnect: true }
          : { connect: { id: dto.organization_id } };
    }

    try {
      return await this.prisma.post.update({
        where: { id: postId },
        data,
      });
    } catch (e: unknown) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2003'
      ) {
        throw new BadRequestException('POST_AUTHOR_OR_ORGANIZATION_NOT_FOUND');
      }
      throw e;
    }
  }

  async deletePost(id: string, requesterUserId: number): Promise<Post> {
    const post = await this.getPostById(id);

    const requester = await this.prisma.user.findUnique({
      where: { id: requesterUserId },
      include: { role: true },
    });

    const isAdmin = requester?.role?.name === 'ADMIN';
    const isAuthor = post.author_id === requesterUserId;

    if (!isAdmin && !isAuthor) {
      throw new ForbiddenException('POST_DELETE_FORBIDDEN_NOT_AUTHOR_OR_ADMIN');
    }

    return this.prisma.post.delete({
      where: { id: post.id },
    });
  }
}
