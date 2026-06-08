import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Post, Prisma } from '@prisma/client';
import type { CreatePostDto, UpdatePostDto } from 'src/post/dtos/post.dto';
import type { PostCommentWithAuthor } from 'src/post/types/post-engagement.types';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { PostService } from './post.service';

describe('PostService', () => {
  let service: PostService;
  let prisma: {
    post: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    user: { findUnique: jest.Mock };
    postComment: {
      findFirst: jest.Mock;
      create: jest.Mock;
      delete: jest.Mock;
    };
  };

  const mockPost: Post = {
    id: 1,
    author_id: 1,
    organization_id: null,
    title: 'Titre',
    content: '<p>Contenu</p>',
    media_url: null,
    category: null,
    mood: null,
    is_published: false,
    created_at: new Date('2025-01-01'),
    updated_at: new Date('2025-01-01'),
  };

  beforeEach(async () => {
    prisma = {
      post: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      user: { findUnique: jest.fn() },
      postComment: {
        findFirst: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<PostService>(PostService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const mockAuthor = { id: 1, first_name: 'Jean', last_name: 'Dupont' };

  const rowWithEngagement = {
    ...mockPost,
    _count: { likes: 2, comments: 3 },
    likes: [] as { id: number }[],
    author: mockAuthor,
  };

  const expectedEngagementInclude = (userId: number) => ({
    _count: { select: { likes: true, comments: true } },
    likes: { where: { user_id: userId }, select: { id: true }, take: 1 },
    author: { select: { id: true, first_name: true, last_name: true } },
  });

  describe('getPosts', () => {
    it('devrait retourner la première page sans curseur (limit 20 par défaut)', async () => {
      prisma.post.findMany.mockResolvedValue([rowWithEngagement]);

      const result = await service.getPosts(9);

      expect(result).toEqual([
        {
          ...mockPost,
          author: mockAuthor,
          likes_count: 2,
          comments_count: 3,
          liked_by_me: false,
        },
      ]);
      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
          orderBy: { created_at: 'desc' },
          include: expectedEngagementInclude(9),
        }),
      );
    });

    it('devrait appliquer le curseur pour la pagination', async () => {
      prisma.post.findMany.mockResolvedValue([rowWithEngagement]);

      await service.getPosts(9, 5, 10);

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          cursor: { id: 5 },
          skip: 1,
          orderBy: { created_at: 'desc' },
          include: expectedEngagementInclude(9),
        }),
      );
    });

    it('ne doit pas passer cursor/skip si cursor est absent', async () => {
      prisma.post.findMany.mockResolvedValue([]);

      await service.getPosts(9, undefined, 5);

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 }),
      );
      /* eslint-disable @typescript-eslint/no-unsafe-assignment */
      expect(prisma.post.findMany).not.toHaveBeenCalledWith(
        expect.objectContaining({ cursor: expect.anything() }),
      );
      expect(prisma.post.findMany).not.toHaveBeenCalledWith(
        expect.objectContaining({ skip: expect.anything() }),
      );
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
    });
  });

  describe('getPostById', () => {
    it('devrait retourner un post par id avec engagement et auteur', async () => {
      prisma.post.findUnique.mockResolvedValue({
        ...rowWithEngagement,
        likes: [{ id: 1 }],
      });

      const result = await service.getPostById('1', 9);

      expect(result).toEqual({
        ...mockPost,
        author: mockAuthor,
        likes_count: 2,
        comments_count: 3,
        liked_by_me: true,
      });
      expect(prisma.post.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          include: expectedEngagementInclude(9),
        }),
      );
    });

    it("devrait lancer NotFoundException si le post n'existe pas", async () => {
      prisma.post.findUnique.mockResolvedValue(null);

      await expect(service.getPostById('999', 1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('devrait lancer BadRequestException si id invalide', async () => {
      await expect(service.getPostById('bad', 1)).rejects.toThrow(
        'POST_ID_MUST_BE_A_NUMBER',
      );
      expect(prisma.post.findUnique).not.toHaveBeenCalled();
    });
  });

  const mockCommentAuthor: PostCommentWithAuthor = {
    id: 2,
    post_id: 1,
    user_id: 3,
    parent_id: null,
    content: 'Racine',
    created_at: new Date('2025-01-01'),
    updated_at: new Date('2025-01-01'),
    user: { id: 3, first_name: 'A', last_name: 'B' },
  };

  describe('createPostComment', () => {
    beforeEach(() => {
      prisma.post.findUnique.mockResolvedValue({ id: 1 });
    });

    it('devrait créer un commentaire sans parent', async () => {
      prisma.postComment.create.mockResolvedValue(mockCommentAuthor);

      await expect(
        service.createPostComment('1', 'Racine', 3),
      ).resolves.toEqual(mockCommentAuthor);

      expect(prisma.postComment.findFirst).not.toHaveBeenCalled();
      expect(prisma.postComment.create).toHaveBeenCalledWith({
        data: {
          post_id: 1,
          user_id: 3,
          content: 'Racine',
          parent_id: null,
        },
        include: {
          user: { select: { id: true, first_name: true, last_name: true } },
        },
      });
    });

    it('devrait créer une réponse si le parent existe sur le même post', async () => {
      prisma.postComment.findFirst.mockResolvedValue({ id: 10 });
      prisma.postComment.create.mockResolvedValue({
        ...mockCommentAuthor,
        id: 11,
        parent_id: 10,
        content: 'Réponse',
      });

      await expect(
        service.createPostComment('1', 'Réponse', 3, 10),
      ).resolves.toMatchObject({ parent_id: 10, content: 'Réponse' });

      expect(prisma.postComment.findFirst).toHaveBeenCalledWith({
        where: { id: 10, post_id: 1 },
        select: { id: true },
      });
      expect(prisma.postComment.create).toHaveBeenCalledWith({
        data: {
          post_id: 1,
          user_id: 3,
          content: 'Réponse',
          parent_id: 10,
        },
        include: {
          user: { select: { id: true, first_name: true, last_name: true } },
        },
      });
    });

    it('devrait refuser un parent absent ou sur un autre post', async () => {
      prisma.postComment.findFirst.mockResolvedValue(null);

      await expect(
        service.createPostComment('1', 'x', 3, 999),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(service.createPostComment('1', 'x', 3, 999)).rejects.toThrow(
        'POST_COMMENT_PARENT_NOT_FOUND_OR_WRONG_POST',
      );
      expect(prisma.postComment.create).not.toHaveBeenCalled();
    });
  });

  describe('createPost', () => {
    it('devrait créer un post', async () => {
      prisma.post.create.mockResolvedValue(mockPost);

      const dto: CreatePostDto = {
        title: 'Titre',
        content: '<p>Contenu</p>',
        author_id: 1,
      };

      await expect(service.createPost(dto)).resolves.toEqual(mockPost);
      expect(prisma.post.create).toHaveBeenCalledWith({
        data: {
          title: 'Titre',
          content: '<p>Contenu</p>',
          media_url: null,
          category: null,
          mood: null,
          is_published: false,
          author_id: 1,
          organization_id: null,
        },
      });
    });

    it('devrait lancer BadRequestException si user/org inexistant (P2003)', async () => {
      const err = new Prisma.PrismaClientKnownRequestError('FK', {
        code: 'P2003',
        clientVersion: 'test',
      });
      prisma.post.create.mockRejectedValue(err);

      await expect(
        service.createPost({
          title: 'T',
          content: 'c',
          author_id: 999,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('updatePost', () => {
    it('devrait mettre à jour un post', async () => {
      prisma.post.findUnique.mockResolvedValue(mockPost);
      prisma.post.update.mockResolvedValue(mockPost);

      const dto: UpdatePostDto = { is_published: true };
      await expect(service.updatePost('1', dto)).resolves.toEqual(mockPost);

      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { is_published: true },
      });
    });

    it('devrait lancer BadRequestException si id invalide', async () => {
      await expect(
        service.updatePost('x', { title: 'A' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.post.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteComment', () => {
    beforeEach(() => {
      prisma.post.findUnique.mockResolvedValue({ id: 1 });
    });

    it("devrait supprimer si l'utilisateur est l'auteur du commentaire", async () => {
      prisma.postComment.findFirst.mockResolvedValue({ id: 5, user_id: 3 });
      prisma.postComment.delete.mockResolvedValue(undefined);

      await expect(service.deleteComment('1', '5', 3)).resolves.toBeUndefined();

      expect(prisma.postComment.delete).toHaveBeenCalledWith({
        where: { id: 5 },
      });
    });

    it("devrait lancer ForbiddenException si l'utilisateur n'est pas l'auteur", async () => {
      prisma.postComment.findFirst.mockResolvedValue({ id: 5, user_id: 3 });

      await expect(service.deleteComment('1', '5', 99)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      await expect(service.deleteComment('1', '5', 99)).rejects.toThrow(
        'COMMENT_DELETE_FORBIDDEN_NOT_AUTHOR',
      );
      expect(prisma.postComment.delete).not.toHaveBeenCalled();
    });

    it('devrait lancer NotFoundException si le commentaire est introuvable', async () => {
      prisma.postComment.findFirst.mockResolvedValue(null);

      await expect(service.deleteComment('1', '999', 3)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.postComment.delete).not.toHaveBeenCalled();
    });

    it('devrait lancer NotFoundException si le post est introuvable', async () => {
      prisma.post.findUnique.mockResolvedValue(null);

      await expect(service.deleteComment('999', '5', 3)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.postComment.findFirst).not.toHaveBeenCalled();
    });

    it('devrait lancer BadRequestException si postId invalide', async () => {
      await expect(service.deleteComment('bad', '5', 3)).rejects.toThrow(
        'POST_ID_MUST_BE_A_NUMBER',
      );
    });

    it('devrait lancer BadRequestException si commentId invalide', async () => {
      await expect(service.deleteComment('1', 'bad', 3)).rejects.toThrow(
        'COMMENT_ID_MUST_BE_A_NUMBER',
      );
    });
  });

  describe('deletePost', () => {
    beforeEach(() => {
      prisma.post.findUnique.mockResolvedValue(mockPost);
    });

    it("devrait supprimer si l'utilisateur est l'auteur", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        role: { id: 3, name: 'CLIENT' },
      });
      prisma.post.delete.mockResolvedValue(mockPost);

      await expect(service.deletePost('1', 1)).resolves.toEqual(mockPost);
      expect(prisma.post.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('devrait supprimer si ADMIN (pas auteur)', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 99,
        role: { id: 1, name: 'ADMIN' },
      });
      prisma.post.delete.mockResolvedValue(mockPost);

      await expect(service.deletePost('1', 99)).resolves.toEqual(mockPost);
      expect(prisma.post.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('devrait refuser si ni auteur ni ADMIN', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 2,
        role: { id: 3, name: 'CLIENT' },
      });

      await expect(service.deletePost('1', 2)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      await expect(service.deletePost('1', 2)).rejects.toThrow(
        'POST_DELETE_FORBIDDEN_NOT_AUTHOR_OR_ADMIN',
      );
      expect(prisma.post.delete).not.toHaveBeenCalled();
    });
  });
});
