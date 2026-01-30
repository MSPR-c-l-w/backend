import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationService } from './organization.service';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('OrganizationService', () => {
  let service: OrganizationService;
  let prisma: {
    organization: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      organization: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<OrganizationService>(OrganizationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOrganizations', () => {
    it('retourne les organisations de Prisma', async () => {
      const orgs = [{ id: 1 }, { id: 2 }] as any[];
      prisma.organization.findMany.mockResolvedValue(orgs);

      await expect(service.getOrganizations()).resolves.toEqual(orgs);
      expect(prisma.organization.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { is_deleted: false },
        }),
      );
    });

    it('throw NotFoundException si aucune organisation', async () => {
      prisma.organization.findMany.mockResolvedValue([]);
      await expect(service.getOrganizations()).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('getOrganizationById', () => {
    it('appelle Prisma avec un id parsé en number', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const org = { id: 42, is_deleted: false } as any;
      prisma.organization.findUnique.mockResolvedValue(org);

      await expect(service.getOrganizationById('42')).resolves.toEqual(org);
      expect(prisma.organization.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 42 },
        }),
      );
    });
  });
});
