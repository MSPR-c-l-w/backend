/* eslint-disable prettier/prettier */
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { CreateUserDto } from 'src/users/dtos/create.user.dto';
import { UpdateUserDto } from 'src/users/dtos/update.user.dto';
import { UpdateUserRoleDto } from 'src/users/dtos/update-user-role.dto';
import type {
  IUsersService,
  UserRole,
} from 'src/users/interfaces/users.interface.js';
import { User } from 'src/utils/types';
import { hashPassword } from 'src/utils/security/password';

@Injectable()
export class UsersService implements IUsersService {
  constructor(private readonly prisma: PrismaService) {}

  private userSelect() {
    return {
      id: true,
      organization_id: true,
      role_id: true,
      email: true,
      first_name: true,
      last_name: true,
      date_of_birth: true,
      gender: true,
      height: true,
      created_at: true,
      updated_at: true,
      deleted_at: true,
      is_active: true,
      is_deleted: true,
    } as const;
  }

  async getUsers(): Promise<User[]> {
    const users = (await this.prisma.user.findMany({
      select: this.userSelect(),
    })) as User[];

    if (users.length === 0) {
      throw new NotFoundException('NO_USERS_FOUND');
    }

    return users;
  }

  async getRoles(): Promise<UserRole[]> {
    return (await this.prisma.role.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    })) as UserRole[];
  }

  async getUserById(id: string): Promise<User> {
    const user = (await this.prisma.user.findUnique({
      where: {
        id: parseInt(id),
      },
      select: this.userSelect(),
    })) as User | null;

    if (!user || user.is_deleted) {
      throw new NotFoundException('USER_NOT_FOUND');
    }

    return user;
  }

  async createUser(user: CreateUserDto): Promise<User> {
    const organizationId = user.organization_id;
    const roleId = user.role_id;
    const passwordHash = await hashPassword(user.password);

    const data: {
      organization_id?: number;
      role_id?: number;
      email: string;
      password_hash: string;
      first_name: string;
      last_name: string;
      date_of_birth: Date;
      gender: string;
      height: number;
      is_active: boolean;
      is_deleted: boolean;
    } = {
      email: user.email,
      password_hash: passwordHash,
      first_name: user.first_name,
      last_name: user.last_name,
      date_of_birth: new Date(user.date_of_birth),
      gender: user.gender,
      height: user.height,
      is_active: true,
      is_deleted: false,
    };

    if (organizationId != null) {
      data.organization_id = organizationId;
    }
    if (roleId != null) {
      data.role_id = roleId;
    }

    return await this.prisma.user.create({
      data,
      select: this.userSelect(),
    });
  }

  async updateUser(id: string, user: UpdateUserDto): Promise<User> {
    await this.getUserById(id);
    const data: {
      email?: string;
      first_name?: string;
      last_name?: string;
      height?: number;
      organization_id?: number;
      role_id?: number | null;
    } = {};

    if (user.email !== undefined) {
      data.email = user.email;
    }
    if (user.first_name !== undefined) {
      data.first_name = user.first_name;
    }
    if (user.last_name !== undefined) {
      data.last_name = user.last_name;
    }
    if (user.height !== undefined) {
      data.height = user.height;
    }
    if (user.organization_id != null) {
      data.organization_id = user.organization_id;
    }
    if (user.role_id !== undefined) {
      if (user.role_id === null) {
        data.role_id = null;
      } else {
        const coercedRoleId = Number(user.role_id);
        if (!Number.isInteger(coercedRoleId)) {
          throw new BadRequestException('ROLE_ID_MUST_BE_A_NUMBER');
        }
        data.role_id = coercedRoleId;
      }
    }

    return await this.prisma.user.update({
      where: {
        id: parseInt(id),
      },
      data,
      select: this.userSelect(),
    });
  }

  async updateUserRole(id: string, userRole: UpdateUserRoleDto): Promise<User> {
    await this.getUserById(id);
    if (userRole.role_id === undefined) {
      throw new BadRequestException('ROLE_ID_IS_REQUIRED');
    }
    if (userRole.role_id !== null && userRole.role_id !== undefined) {
      const existingRole = await this.prisma.role.findUnique({
        where: { id: userRole.role_id },
        select: { id: true },
      });
      if (!existingRole) {
        throw new NotFoundException('ROLE_NOT_FOUND');
      }
    }

    const prismaUser = this.prisma.user as unknown as {
      update: (args: {
        where: { id: number };
        data: { role_id: number | null };
        select: ReturnType<UsersService['userSelect']>;
      }) => Promise<User>;
    };

    return await prismaUser.update({
      where: {
        id: parseInt(id),
      },
      data: {
        role_id: userRole.role_id,
      },
      select: this.userSelect(),
    });
  }

  async deleteUser(id: string): Promise<User> {
    await this.getUserById(id);
    return await this.prisma.user.update({
      where: {
        id: parseInt(id),
      },
      data: {
        is_deleted: true,
        deleted_at: new Date(),
        is_active: false,
      },
      select: this.userSelect(),
    });
  }
}
