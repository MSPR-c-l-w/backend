import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { RoleService } from './role.service';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';

describe('RoleService', () => {
  let service: RoleService;
  let prisma: {
    role: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  const mockRole: Role = {
    id: 1,
    name: 'admin',
  };

  beforeEach(async () => {
    prisma = {
      role: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<RoleService>(RoleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRoles', () => {
    it('retourne la liste des rôles', async () => {
      prisma.role.findMany.mockResolvedValue([mockRole]);

      await expect(service.getRoles()).resolves.toEqual([mockRole]);
      expect(prisma.role.findMany).toHaveBeenCalledTimes(1);
    });

    it('throw NotFoundException si aucun rôle', async () => {
      prisma.role.findMany.mockResolvedValue([]);

      await expect(service.getRoles()).rejects.toBeInstanceOf(
        NotFoundException,
      );
      await expect(service.getRoles()).rejects.toThrow('NO_ROLES_FOUND');
    });
  });

  describe('getRoleById', () => {
    it('retourne le rôle demandé', async () => {
      prisma.role.findUnique.mockResolvedValue(mockRole);

      await expect(service.getRoleById('1')).resolves.toEqual(mockRole);
      expect(prisma.role.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('throw NotFoundException si rôle absent', async () => {
      prisma.role.findUnique.mockResolvedValue(null);

      await expect(service.getRoleById('999')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      await expect(service.getRoleById('999')).rejects.toThrow(
        'ROLE_NOT_FOUND',
      );
    });
  });

  describe('createRole', () => {
    it('crée un rôle', async () => {
      prisma.role.create.mockResolvedValue(mockRole);

      await expect(service.createRole({ name: 'admin' })).resolves.toEqual(
        mockRole,
      );
      expect(prisma.role.create).toHaveBeenCalledWith({
        data: { name: 'admin' },
      });
    });
  });

  describe('updateRole', () => {
    it('met à jour un rôle', async () => {
      prisma.role.findUnique.mockResolvedValue(mockRole);
      prisma.role.update.mockResolvedValue({ ...mockRole, name: 'coach' });

      await expect(service.updateRole('1', { name: 'coach' })).resolves.toEqual(
        {
          ...mockRole,
          name: 'coach',
        },
      );
      expect(prisma.role.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'coach' },
      });
    });
  });

  describe('deleteRole', () => {
    it('supprime un rôle', async () => {
      prisma.role.findUnique.mockResolvedValue(mockRole);
      prisma.role.delete.mockResolvedValue(mockRole);

      await expect(service.deleteRole('1')).resolves.toEqual(mockRole);
      expect(prisma.role.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });
});
