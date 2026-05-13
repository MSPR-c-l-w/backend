import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Post, Prisma } from '@prisma/client';
import type { CreatePostDto, UpdatePostDto } from 'src/post/dtos/post.dto';
import { IPostService } from 'src/post/interfaces/post.interface';
import type {
  PostCommentWithAuthor,
  PostWithEngagement,
} from 'src/post/types/post-engagement.types';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';

const postEngagementInclude = (userId: number) =>
  ({
    _count: { select: { likes: true, comments: true } },
    likes: {
      where: { user_id: userId },
      select: { id: true },
      take: 1,
    },
  }) satisfies Prisma.PostInclude;

function mapPostRowToEngagement(
  row: Post & {
    _count: { likes: number; comments: number };
    likes: { id: number }[];
  },
): PostWithEngagement {
  const { _count, likes, ...post } = row;
  return {
    ...post,
    likes_count: _count.likes,
    comments_count: _count.comments,
    liked_by_me: likes.length > 0,
  };
}

@Injectable()
export class PostService implements IPostService {
  constructor(private readonly prisma: PrismaService) {}

  private parsePostId(id: string): number {
    const postId = parseInt(id, 10);
    if (!Number.isInteger(postId)) {
      throw new BadRequestException('POST_ID_MUST_BE_A_NUMBER');
    }
    return postId;
  }

  async getPosts(currentUserId: number): Promise<PostWithEngagement[]> {
    const rows = await this.prisma.post.findMany({
      orderBy: { created_at: 'desc' },
      include: postEngagementInclude(currentUserId),
    });
    return rows.map(mapPostRowToEngagement);
  }

  async getPostById(
    id: string,
    currentUserId: number,
  ): Promise<PostWithEngagement> {
    const postId = this.parsePostId(id);
    const row = await this.prisma.post.findUnique({
      where: { id: postId },
      include: postEngagementInclude(currentUserId),
    });
    if (!row) {
      throw new NotFoundException(`POST_${id}_NOT_FOUND`);
    }
    return mapPostRowToEngagement(row);
  }

  async getPostComments(id: string): Promise<PostCommentWithAuthor[]> {
    const postId = this.parsePostId(id);
    await this.ensurePostExists(postId);

    return this.prisma.postComment.findMany({
      where: { post_id: postId },
      orderBy: { created_at: 'asc' },
      include: {
        user: { select: { id: true, first_name: true, last_name: true } },
      },
    });
  }

  async createPostComment(
    id: string,
    content: string,
    userId: number,
    parentId?: number,
  ): Promise<PostCommentWithAuthor> {
    const postId = this.parsePostId(id);
    await this.ensurePostExists(postId);

    if (parentId !== undefined && parentId !== null) {
      const parent = await this.prisma.postComment.findFirst({
        where: { id: parentId, post_id: postId },
        select: { id: true },
      });
      if (!parent) {
        throw new BadRequestException(
          'POST_COMMENT_PARENT_NOT_FOUND_OR_WRONG_POST',
        );
      }
    }

    return this.prisma.postComment.create({
      data: {
        post_id: postId,
        user_id: userId,
        content,
        parent_id: parentId ?? null,
      },
      include: {
        user: { select: { id: true, first_name: true, last_name: true } },
      },
    });
  }

  async likePost(
    id: string,
    userId: number,
  ): Promise<{ likes_count: number; liked_by_me: boolean }> {
    const postId = this.parsePostId(id);
    await this.ensurePostExists(postId);

    try {
      await this.prisma.postLike.create({
        data: { post_id: postId, user_id: userId },
      });
    } catch (e: unknown) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        // déjà liké
      } else {
        throw e;
      }
    }

    return this.getLikeSummary(postId, userId);
  }

  async unlikePost(
    id: string,
    userId: number,
  ): Promise<{ likes_count: number; liked_by_me: boolean }> {
    const postId = this.parsePostId(id);
    await this.ensurePostExists(postId);

    await this.prisma.postLike.deleteMany({
      where: { post_id: postId, user_id: userId },
    });

    return this.getLikeSummary(postId, userId);
  }

  private async ensurePostExists(postId: number): Promise<void> {
    const exists = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException(`POST_${postId}_NOT_FOUND`);
    }
  }

  private async getLikeSummary(
    postId: number,
    userId: number,
  ): Promise<{ likes_count: number; liked_by_me: boolean }> {
    const [likes_count, mine] = await Promise.all([
      this.prisma.postLike.count({ where: { post_id: postId } }),
      this.prisma.postLike.findFirst({
        where: { post_id: postId, user_id: userId },
        select: { id: true },
      }),
    ]);
    return { likes_count, liked_by_me: mine !== null };
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
    const postId = this.parsePostId(id);
    await this.ensurePostExists(postId);

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
    const post = await this.prisma.post.findUnique({
      where: { id: this.parsePostId(id) },
    });
    if (!post) {
      throw new NotFoundException(`POST_${id}_NOT_FOUND`);
    }

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
