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
  }

  async seedDefaultRoles(): Promise<void> {
    for (const name of DEFAULT_ROLE_NAMES) {
      await this.prisma.role.upsert({
        where: { name },
        create: { name },
        update: {},
      });
    }
  }

  async getRoles(): Promise<Role[]> {
    return this.prisma.role.findMany({
      orderBy: { name: 'asc' },
    });
  }
}
