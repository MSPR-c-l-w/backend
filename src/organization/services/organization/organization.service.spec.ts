/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationService } from './organization.service';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import type {
  CreateOrganizationDto,
  UpdateOrganizationDto,
} from 'src/organization/dtos/organization.dto';

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

  describe('createOrganization', () => {
    it('met is_active à true par défaut', async () => {
      const dto: CreateOrganizationDto = {
        name: 'ACME',
        type: 'gym',
        branding_config: { primaryColor: '#000' },
      };
      const created = { id: 1 } as any;
      prisma.organization.create.mockResolvedValue(created);

      await expect(service.createOrganization(dto)).resolves.toEqual(created);
      expect(prisma.organization.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ is_active: true }),
        }),
      );
    });

    it('permet de créer une org inactive', async () => {
      const dto: CreateOrganizationDto = {
        name: 'ACME',
        type: 'gym',
        is_active: false,
        branding_config: { primaryColor: '#000' },
      };
      const created = { id: 2 } as any;
      prisma.organization.create.mockResolvedValue(created);

      await expect(service.createOrganization(dto)).resolves.toEqual(created);
      expect(prisma.organization.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ is_active: false }),
        }),
      );
    });
  });

  describe('updateOrganization', () => {
    it('permet de modifier is_active', async () => {
      prisma.organization.findUnique.mockResolvedValue({
        id: 1,
        is_deleted: false,
      });
      const updated = { id: 1, is_active: false } as any;
      prisma.organization.update.mockResolvedValue(updated);

      const dto: UpdateOrganizationDto = { is_active: false };
      await expect(service.updateOrganization('1', dto)).resolves.toEqual(
        updated,
      );

      expect(prisma.organization.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: { is_active: false },
        }),
      );
    });
  });
});
