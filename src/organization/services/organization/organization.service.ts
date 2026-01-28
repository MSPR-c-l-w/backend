import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
} from 'src/organization/dtos/organization.dto';
import type { IOrganizationService } from 'src/organization/interfaces/organization.interfaces';
import type { Organization } from 'src/utils/types';

@Injectable()
export class OrganizationService implements IOrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  private selectPublic() {
    return {
      id: true,
      name: true,
      type: true,
      branding_config: true,
      created_at: true,
      updated_at: true,
      deleted_at: true,
      is_active: true,
      is_deleted: true,
    } as const;
  }

  async getOrganizations(): Promise<Organization[]> {
    const orgs = (await this.prisma.organization.findMany({
      where: { is_deleted: false },
      select: this.selectPublic(),
    })) as Organization[];

    if (orgs.length === 0) {
      throw new NotFoundException('NO_ORGANIZATIONS_FOUND');
    }

    return orgs;
  }

  async getOrganizationById(id: string): Promise<Organization> {
    const org = await this.prisma.organization.findUnique({
      where: { id: parseInt(id) },
      select: this.selectPublic(),
    });

    if (!org || org.is_deleted) {
      throw new NotFoundException('ORGANIZATION_NOT_FOUND');
    }

    return org as Organization;
  }

  createOrganization(
    organization: CreateOrganizationDto,
  ): Promise<Organization> {
    return this.prisma.organization.create({
      data: {
        name: organization.name,
        type: organization.type,
        branding_config: organization.branding_config,
        is_active: true,
        is_deleted: false,
      },
      select: this.selectPublic(),
    }) as Promise<Organization>;
  }

  async updateOrganization(
    id: string,
    organization: UpdateOrganizationDto,
  ): Promise<Organization> {
    await this.getOrganizationById(id);

    return this.prisma.organization.update({
      where: { id: parseInt(id) },
      data: {
        ...(organization.name === undefined ? {} : { name: organization.name }),
        ...(organization.type === undefined ? {} : { type: organization.type }),
        ...(organization.branding_config === undefined
          ? {}
          : { branding_config: organization.branding_config }),
      },
      select: this.selectPublic(),
    }) as Promise<Organization>;
  }

  async deleteOrganization(id: string): Promise<Organization> {
    await this.getOrganizationById(id);

    return this.prisma.organization.update({
      where: { id: parseInt(id) },
      data: {
        is_deleted: true,
        deleted_at: new Date(),
        is_active: false,
      },
      select: this.selectPublic(),
    }) as Promise<Organization>;
  }
}
