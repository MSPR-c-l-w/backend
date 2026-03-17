/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { SERVICES } from 'src/utils/constants';
import { UsersService } from './users.service';

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
      count: jest.Mock;
    };
    role: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
    };
  };

  const createUserEntity = (overrides: Record<string, unknown> = {}) => ({
    id: 1,
    organization_id: null,
    role_id: null,
    organization: null,
    role: null,
    email: 'john.doe@example.com',
    first_name: 'John',
    last_name: 'Doe',
    date_of_birth: new Date('2000-01-01'),
    gender: 'Male',
    height: 180,
    healthProfile: null,
    sessions: [],
    subscriptions: [],
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-02'),
    deleted_at: null,
    is_active: true,
    is_deleted: false,
    ...overrides,
  });

  beforeEach(async () => {
    prisma = {
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      role: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: SERVICES.ROLES,
          useValue: { getRoles: jest.fn(), seedDefaultRoles: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUsers', () => {
    it('sans pagination: retourne les users non supprimés avec le select enrichi', async () => {
      const users = [
        createUserEntity(),
        createUserEntity({
          id: 2,
          healthProfile: {
            physical_activity_level: 'active',
            daily_calories_target: 2200,
          },
          sessions: [{ created_at: new Date('2024-01-03') }],
          subscriptions: [{ status: 'true', plan: { name: 'Premium' } }],
        }),
      ];
      prisma.user.findMany.mockResolvedValue(users);

      await expect(service.getUsers()).resolves.toEqual(users);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { is_deleted: false },
          orderBy: { id: 'asc' },
          select: expect.objectContaining({
            healthProfile: {
              select: {
                physical_activity_level: true,
                daily_calories_target: true,
              },
            },
            sessions: {
              orderBy: { created_at: 'desc' },
              take: 1,
              select: { created_at: true },
            },
            subscriptions: {
              where: { status: 'true' },
              orderBy: { end_date: 'desc' },
              take: 1,
              select: {
                status: true,
                plan: { select: { name: true } },
              },
            },
          }),
        }),
      );
    });

    it('sans pagination: retourne un tableau vide quand il n’y a aucun user', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await expect(service.getUsers()).resolves.toEqual([]);
    });

    it('avec pagination: retourne { data, total }', async () => {
      const users = [createUserEntity(), createUserEntity({ id: 2 })];
      prisma.user.findMany.mockResolvedValue(users);
      prisma.user.count.mockResolvedValue(42);

      await expect(service.getUsers({ page: 1, limit: 20 })).resolves.toEqual({
        data: users,
        total: 42,
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { is_deleted: false },
          skip: 0,
          take: 20,
          orderBy: { id: 'asc' },
        }),
      );
      expect(prisma.user.count).toHaveBeenCalledWith({
        where: { is_deleted: false },
      });
    });

    it('avec pagination: calcule skip correctement et normalise page/limit', async () => {
      prisma.user.findMany.mockResolvedValue([createUserEntity({ id: 11 })]);
      prisma.user.count.mockResolvedValue(25);

      await service.getUsers({ page: 2, limit: 10 });
      await service.getUsers({ page: 0, limit: 200 });

      expect(prisma.user.findMany).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
      expect(prisma.user.findMany).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          skip: 0,
          take: 100,
        }),
      );
    });

    it('avec pagination: retourne { data: [], total: 0 } si la liste est vide', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await expect(service.getUsers({ page: 1, limit: 20 })).resolves.toEqual({
        data: [],
        total: 0,
      });
    });

    it('avec recherche: applique le filtre trim sur first_name et last_name', async () => {
      prisma.user.findMany.mockResolvedValue([createUserEntity()]);
      prisma.user.count.mockResolvedValue(1);

      await service.getUsers({ page: 1, limit: 20, search: '  john  ' });

      const expectedWhere = {
        is_deleted: false,
        OR: [
          { first_name: { contains: 'john' } },
          { last_name: { contains: 'john' } },
        ],
      };

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expectedWhere,
        }),
      );
      expect(prisma.user.count).toHaveBeenCalledWith({
        where: expectedWhere,
      });
    });
  });

  describe('getUsersStats', () => {
    it('retourne les agrégats attendus', async () => {
      prisma.user.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(80)
        .mockResolvedValueOnce(30)
        .mockResolvedValueOnce(12);

      await expect(service.getUsersStats()).resolves.toEqual({
        totalUsers: 100,
        activeUsers: 80,
        premiumUsers: 30,
        b2bUsers: 12,
      });

      expect(prisma.user.count).toHaveBeenNthCalledWith(1, {
        where: { is_deleted: false },
      });
      expect(prisma.user.count).toHaveBeenNthCalledWith(2, {
        where: { is_deleted: false, is_active: true },
      });
      expect(prisma.user.count).toHaveBeenNthCalledWith(3, {
        where: {
          is_deleted: false,
          subscriptions: {
            some: {
              status: 'true',
              plan: { name: 'Premium' },
            },
          },
        },
      });
      expect(prisma.user.count).toHaveBeenNthCalledWith(4, {
        where: {
          is_deleted: false,
          subscriptions: {
            some: {
              status: 'true',
              plan: { name: 'B2B' },
            },
          },
        },
      });
    });
  });

  describe('getUserById', () => {
    it('appelle Prisma avec un id parsé en number et le select enrichi', async () => {
      const user = createUserEntity({ id: 42 });
      prisma.user.findUnique.mockResolvedValue(user);

      await expect(service.getUserById('42')).resolves.toEqual(user);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 42 },
        select: expect.objectContaining({
          healthProfile: expect.any(Object),
          sessions: expect.any(Object),
          subscriptions: expect.any(Object),
        }),
      });
    });

    it('throw NotFoundException si user introuvable', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserById('42')).rejects.toThrow(
        new NotFoundException('USER_NOT_FOUND'),
      );
    });

    it('throw NotFoundException si user supprimé', async () => {
      prisma.user.findUnique.mockResolvedValue(
        createUserEntity({ is_deleted: true }),
      );

      await expect(service.getUserById('42')).rejects.toThrow(
        new NotFoundException('USER_NOT_FOUND'),
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

      const created = createUserEntity({ id: 1, email: dto.email });
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

      expect(
        prisma.user.create.mock.calls[0][0].data.organization_id,
      ).toBeUndefined();
    });

    it('ajoute organization_id si fourni', async () => {
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

      const created = createUserEntity({ id: 123, organization_id: 7 });
      prisma.user.create.mockResolvedValue(created);

      await expect(service.createUser(dto)).resolves.toEqual(created);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organization_id: 7,
        }),
        select: expect.any(Object),
      });
    });

    it('throw BadRequestException si email déjà utilisé (P2002)', async () => {
      const dto = {
        email: 'existing@test.com',
        password: 'pw',
        first_name: 'A',
        last_name: 'B',
        date_of_birth: '2000-01-01',
        gender: 'X',
        height: 180,
      } as any;
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', meta: { modelName: 'User' }, clientVersion: '7.x' },
      );
      prisma.user.create.mockRejectedValue(prismaError);

      const promise = service.createUser(dto);
      await expect(promise).rejects.toBeInstanceOf(BadRequestException);
      await expect(promise).rejects.toMatchObject({
        message: 'EMAIL_ALREADY_USED',
      });
    });

    it('throw BadRequestException si organisation introuvable (P2003)', async () => {
      const dto = {
        organization_id: 999,
        email: 'a@b.com',
        password: 'pw',
        first_name: 'A',
        last_name: 'B',
        date_of_birth: '2000-01-01',
        gender: 'X',
        height: 180,
      } as any;
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        { code: 'P2003', meta: { modelName: 'User' }, clientVersion: '7.x' },
      );
      prisma.user.create.mockRejectedValue(prismaError);

      const promise = service.createUser(dto);
      await expect(promise).rejects.toBeInstanceOf(BadRequestException);
      await expect(promise).rejects.toMatchObject({
        message: 'ORGANIZATION_NOT_FOUND',
      });
    });
  });

  describe('updateUser', () => {
    it('met à jour les champs fournis sans organization_id absent', async () => {
      const updated = createUserEntity({ first_name: 'New' });
      prisma.user.findUnique.mockResolvedValue(createUserEntity());
      prisma.user.update.mockResolvedValue(updated);

      await expect(
        service.updateUser('1', { first_name: 'New' } as any),
      ).resolves.toEqual(updated);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { first_name: 'New' },
        select: expect.any(Object),
      });
    });

    it('ajoute organization_id si fourni', async () => {
      const updated = createUserEntity({
        organization_id: 99,
        first_name: 'New',
      });
      prisma.user.findUnique.mockResolvedValue(createUserEntity());
      prisma.user.update.mockResolvedValue(updated);

      await expect(
        service.updateUser('1', {
          organization_id: 99,
          first_name: 'New',
        } as any),
      ).resolves.toEqual(updated);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          first_name: 'New',
          organization_id: 99,
        },
        select: expect.any(Object),
      });
    });

    it('throw NotFoundException si user introuvable', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const dto = { first_name: 'New' } as any;

      await expect(service.updateUser('1', dto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('updateUserRole', () => {
    it('throw BadRequestException si role_id est undefined', async () => {
      prisma.user.findUnique.mockResolvedValue(createUserEntity());

      await expect(service.updateUserRole('1', {} as any)).rejects.toThrow(
        new BadRequestException('ROLE_ID_IS_REQUIRED'),
      );
    });

    it('throw NotFoundException si le rôle n’existe pas', async () => {
      prisma.user.findUnique.mockResolvedValue(createUserEntity());
      prisma.role.findUnique.mockResolvedValue(null);

      await expect(service.updateUserRole('1', { role_id: 2 })).rejects.toThrow(
        new NotFoundException('ROLE_NOT_FOUND'),
      );
    });

    it('met à jour avec un rôle existant', async () => {
      const updated = createUserEntity({ role_id: 2 });
      prisma.user.findUnique.mockResolvedValue(createUserEntity());
      prisma.role.findUnique.mockResolvedValue({ id: 2 });
      prisma.user.update.mockResolvedValue(updated);

      await expect(
        service.updateUserRole('1', { role_id: 2 }),
      ).resolves.toEqual(updated);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { role_id: 2 },
        select: expect.any(Object),
      });
    });

    it('retire le rôle si role_id est null', async () => {
      const updated = createUserEntity({ role_id: null });
      prisma.user.findUnique.mockResolvedValue(createUserEntity());
      prisma.user.update.mockResolvedValue(updated);

      await expect(
        service.updateUserRole('1', { role_id: null }),
      ).resolves.toEqual(updated);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { role_id: null },
        select: expect.any(Object),
      });
    });

    it('throw BadRequestException si role_id est undefined', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1, is_deleted: false });

      const promise = service.updateUserRole('1', {} as any);
      await expect(promise).rejects.toBeInstanceOf(BadRequestException);
      await expect(promise).rejects.toMatchObject({
        message: 'ROLE_ID_IS_REQUIRED',
      });
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('throw NotFoundException si le role n’existe pas', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1, is_deleted: false });
      prisma.role.findUnique.mockResolvedValue(null);

      const promise = service.updateUserRole('1', { role_id: 999 });
      await expect(promise).rejects.toBeInstanceOf(NotFoundException);
      await expect(promise).rejects.toMatchObject({
        message: 'ROLE_NOT_FOUND',
      });
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('fait un soft-delete', async () => {
      const deleted = createUserEntity({ is_deleted: true, is_active: false });
      prisma.user.findUnique.mockResolvedValue(createUserEntity());
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

    it('throw NotFoundException si user introuvable', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.deleteUser('1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });
});
