import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Post, Prisma } from '@prisma/client';
import type { CreatePostDto, UpdatePostDto } from 'src/post/dtos/post.dto';
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
  };

  const mockPost: Post = {
    id: 1,
    author_id: 1,
    organization_id: null,
    title: 'Titre',
    content: '<p>Contenu</p>',
    media_url: null,
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

  describe('getPosts', () => {
    it('devrait retourner la liste des posts', async () => {
      prisma.post.findMany.mockResolvedValue([mockPost]);

      const result = await service.getPosts();

      expect(result).toEqual([mockPost]);
      expect(prisma.post.findMany).toHaveBeenCalledWith({
        orderBy: { created_at: 'desc' },
      });
    });
  });

  describe('getPostById', () => {
    it('devrait retourner un post par id', async () => {
      prisma.post.findUnique.mockResolvedValue(mockPost);

      const result = await service.getPostById('1');

      expect(result).toEqual(mockPost);
      expect(prisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("devrait lancer NotFoundException si le post n'existe pas", async () => {
      prisma.post.findUnique.mockResolvedValue(null);

      await expect(service.getPostById('999')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('devrait lancer BadRequestException si id invalide', async () => {
      await expect(service.getPostById('bad')).rejects.toThrow(
        'POST_ID_MUST_BE_A_NUMBER',
      );
      expect(prisma.post.findUnique).not.toHaveBeenCalled();
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
