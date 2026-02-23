/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto } from 'src/role/dtos/role.dto';
import type { IRoleService } from 'src/role/interfaces/role.interface';

@Injectable()
export class RoleService implements IRoleService {
  constructor(private readonly prisma: PrismaService) {}

  async getRoles(): Promise<Role[]> {
    const roles = await this.prisma.role.findMany();
    if (roles.length === 0) {
      throw new NotFoundException('NO_ROLES_FOUND');
    }
    return roles;
  }

  async getRoleById(id: string): Promise<Role> {
    const role = await this.prisma.role.findUnique({
      where: { id: parseInt(id) },
    });
    if (!role) {
      throw new NotFoundException('ROLE_NOT_FOUND');
    }
    return role;
  }

  createRole(role: CreateRoleDto): Promise<Role> {
    return this.prisma.role.create({
      data: { name: role.name },
    });
  }

  async updateRole(id: string, role: UpdateRoleDto): Promise<Role> {
    await this.getRoleById(id);
    return this.prisma.role.update({
      where: { id: parseInt(id) },
      data: {
        ...(role.name === undefined ? {} : { name: role.name }),
      },
    });
  }

  async deleteRole(id: string): Promise<Role> {
    await this.getRoleById(id);
    return this.prisma.role.delete({
      where: { id: parseInt(id) },
    });
  }
}
