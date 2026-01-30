/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

jest.mock('src/utils/security/password', () => ({
  hashPassword: jest.fn(() => 'HASHED_PASSWORD'),
}));

describe('UsersService', () => {
  let service: UsersService;
  let prisma: {
    user: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUsers', () => {
    it('retourne les users de Prisma', async () => {
      const users = [{ id: 1 }, { id: 2 }] as any[];
      prisma.user.findMany.mockResolvedValue(users);

      await expect(service.getUsers()).resolves.toEqual(users);
      expect(prisma.user.findMany).toHaveBeenCalledTimes(1);
    });

    it('throw NotFoundException si aucun user', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      await expect(service.getUsers()).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('getUserById', () => {
    it('appelle Prisma avec un id parsé en number', async () => {
      const user = { id: 42 } as any;
      prisma.user.findUnique.mockResolvedValue(user);

      await expect(service.getUserById('42')).resolves.toEqual(user);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 42 },
        select: expect.any(Object),
      });
    });

    it('throw NotFoundException si user introuvable', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getUserById('42')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('createUser', () => {
    it('crée un user sans organisation si organization_id est absent', async () => {
      const dto = {
        email: 'tcarron6@outlook.com',
        password: 'testtest',
        first_name: 'Thibault',
        last_name: 'Carron',
        date_of_birth: '2004-11-06',
        gender: 'Male',
        height: 178,
      } as any;

      const created = { id: 1, ...dto, password_hash: dto.password };
      prisma.user.create.mockResolvedValue(created);

      await expect(service.createUser(dto)).resolves.toEqual(created);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: dto.email,
          password_hash: 'HASHED_PASSWORD',
          first_name: dto.first_name,
          last_name: dto.last_name,
          date_of_birth: new Date(dto.date_of_birth),
          gender: dto.gender,
          height: dto.height,
          is_active: true,
          is_deleted: false,
        }),
        select: expect.any(Object),
      });

      // Pas de connect si pas d'organization_id
      const callArg = prisma.user.create.mock.calls[0][0];
      expect(callArg.data.organization).toBeUndefined();
    });

    it('connecte une organisation si organization_id est fourni', async () => {
      const dto = {
        organization_id: 7,
        email: 'a@b.com',
        password: 'pw',
        first_name: 'A',
        last_name: 'B',
        date_of_birth: '2000-01-01',
        gender: 'X',
        height: 180,
      } as any;

      const created = { id: 123 } as any;
      prisma.user.create.mockResolvedValue(created);

      await expect(service.createUser(dto)).resolves.toEqual(created);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organization: { connect: { id: 7 } },
        }),
        select: expect.any(Object),
      });
    });
  });

  describe('updateUser', () => {
    it('met à jour sans connect si organization_id est absent', async () => {
      const updated = { id: 1 } as any;
      prisma.user.findUnique.mockResolvedValue({ id: 1, is_deleted: false });
      prisma.user.update.mockResolvedValue(updated);

      const dto = { first_name: 'New' } as any;
      await expect(service.updateUser('1', dto)).resolves.toEqual(updated);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { first_name: 'New' },
        select: expect.any(Object),
      });
    });

    it('connecte une organisation si organization_id est fourni', async () => {
      const updated = { id: 1 } as any;
      prisma.user.findUnique.mockResolvedValue({ id: 1, is_deleted: false });
      prisma.user.update.mockResolvedValue(updated);

      const dto = { organization_id: 99, first_name: 'New' } as any;
      await expect(service.updateUser('1', dto)).resolves.toEqual(updated);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          first_name: 'New',
          organization: { connect: { id: 99 } },
        },
        select: expect.any(Object),
      });
    });
  });

  describe('deleteUser', () => {
    it('fait un soft-delete', async () => {
      const deleted = { id: 1, is_deleted: true } as any;
      prisma.user.findUnique.mockResolvedValue({ id: 1, is_deleted: false });
      prisma.user.update.mockResolvedValue(deleted);

      await expect(service.deleteUser('1')).resolves.toEqual(deleted);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          is_deleted: true,
          deleted_at: expect.any(Date),
          is_active: false,
        },
        select: expect.any(Object),
      });
    });
  });
});
