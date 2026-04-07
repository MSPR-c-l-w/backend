import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Post } from '@prisma/client';
import type { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PostController } from './post.controller';
import { SERVICES } from 'src/utils/constants';

describe('PostController', () => {
  let controller: PostController;
  const postServiceMock = {
    getPosts: jest.fn(),
    getPostById: jest.fn(),
    createPost: jest.fn(),
    updatePost: jest.fn(),
    deletePost: jest.fn(),
  };

  const mockPost: Post = {
    id: 1,
    author_id: 1,
    organization_id: null,
    title: 'Titre',
    content: '<p>Contenu</p>',
    media_url: null,
    is_published: false,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostController],
      providers: [
        {
          provide: SERVICES.POST,
          useValue: postServiceMock,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PostController>(PostController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getPosts', () => {
    it('devrait retourner la liste', async () => {
      postServiceMock.getPosts.mockResolvedValue([mockPost]);

      const result = await controller.getPosts();

      expect(result).toEqual([mockPost]);
      expect(postServiceMock.getPosts).toHaveBeenCalledTimes(1);
    });
  });

  describe('getPostById', () => {
    it('devrait retourner un post', async () => {
      postServiceMock.getPostById.mockResolvedValue(mockPost);

      const result = await controller.getPostById('1');

      expect(result).toEqual(mockPost);
      expect(postServiceMock.getPostById).toHaveBeenCalledWith('1');
    });

    it('devrait propager les erreurs du service', async () => {
      postServiceMock.getPostById.mockRejectedValue(
        new NotFoundException('Post introuvable'),
      );

      await expect(controller.getPostById('999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createPost', () => {
    it('devrait créer un post', async () => {
      postServiceMock.createPost.mockResolvedValue(mockPost);

      const dto = {
        title: 'T',
        content: 'c',
        author_id: 1,
      };

      const result = await controller.createPost(dto);

      expect(result).toEqual(mockPost);
      expect(postServiceMock.createPost).toHaveBeenCalledWith(dto);
    });
  });

  describe('deletePost', () => {
    it('devrait appeler le service avec id et sub JWT', async () => {
      postServiceMock.deletePost.mockResolvedValue(mockPost);
      const req = {
        user: { sub: 42, email: 'x@y.z' },
      } as unknown as Request;

      const result = await controller.deletePost('7', req);

      expect(result).toEqual(mockPost);
      expect(postServiceMock.deletePost).toHaveBeenCalledWith('7', 42);
    });
  });
});
