import { Injectable, OnModuleInit } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import type { IRoleService } from 'src/roles/interfaces/role.interface';
import { DEFAULT_ROLE_NAMES } from 'src/roles/interfaces/role.interface';

@Injectable()
export class RolesService implements IRoleService, OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await this.seedDefaultRoles();
    await this.assignDefaultRoleToUsersWithoutRole();
  }

  async assignDefaultRoleToUsersWithoutRole(): Promise<void> {
    const clientRole = await this.prisma.role.findFirst({
      where: { name: 'CLIENT' },
      select: { id: true },
    });
    if (!clientRole) return;
    await this.prisma.user.updateMany({
      where: { role_id: null },
      data: { role_id: clientRole.id },
    });
  }

  async seedDefaultRoles(): Promise<void> {
    await this.prisma.role.createMany({
      data: DEFAULT_ROLE_NAMES.map((name) => ({ name })),
      skipDuplicates: true,
    });
  }

  async getRoles(): Promise<Role[]> {
    return this.prisma.role.findMany({
      orderBy: { name: 'asc' },
    });
  }
}
