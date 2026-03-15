import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import type { IRoleService } from 'src/roles/interfaces/role.interface';
import { CreateUserDto } from 'src/users/dtos/create.user.dto';
import { UpdateUserDto } from 'src/users/dtos/update.user.dto';
import { UpdateUserRoleDto } from 'src/users/dtos/update-user-role.dto';
import type { IUsersService } from 'src/users/interfaces/users.interface.js';
import type { PaginatedUsersResponse } from 'src/users/types';
import { SERVICES } from 'src/utils/constants';
import { hashPassword } from 'src/utils/security/password';
import { User } from 'src/utils/types';
import { GetUsersDto } from 'src/users/dtos/get.users.dto';

@Injectable()
export class UsersService implements IUsersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(SERVICES.ROLES) private readonly rolesService: IRoleService,
  ) {}

  private userSelect() {
    return {
      id: true,
      organization_id: true,
      role_id: true,
      organization: {
        select: {
          id: true,
          name: true,
          type: true,
          branding_config: true,
          created_at: true,
          updated_at: true,
          deleted_at: true,
          is_active: true,
          is_deleted: true,
        },
      },
      role: {
        select: {
          id: true,
          name: true,
        },
      },
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

  async getUsers(
    query?: GetUsersDto,
  ): Promise<User[] | PaginatedUsersResponse> {
    const usePagination =
      query != null && (query.page !== undefined || query.limit !== undefined);

    const baseWhere = { is_deleted: false };

    const search = query?.search?.trim() || undefined;
    const where = search
      ? {
          ...baseWhere,
          OR: [
            { first_name: { contains: search } },
            { last_name: { contains: search } },
          ],
        }
      : baseWhere;

    if (!usePagination) {
      const users = (await this.prisma.user.findMany({
        where: { is_deleted: false },
        select: this.userSelect(),
        orderBy: { id: 'asc' },
      })) as User[];
      return users;
    }
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, Math.min(100, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: this.userSelect(),
        skip,
        take: limit,
        orderBy: { id: 'asc' },
      }) as Promise<User[]>,
      this.prisma.user.count({ where }),
    ]);
    return { data: users, total };
  }

  async getUsersStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    premiumUsers: number;
    b2bUsers: number;
  }> {
    const [totalUsers, activeUsers, premiumUsers, b2bUsers] = await Promise.all(
      [
        this.prisma.user.count({
          where: { is_deleted: false },
        }),
        this.prisma.user.count({
          where: { is_deleted: false, is_active: true },
        }),
        this.prisma.user.count({
          where: {
            is_deleted: false,
            subscriptions: {
              some: {
                status: 'true',
                plan: { name: 'Premium' },
              },
            },
          },
        }),
        this.prisma.user.count({
          where: {
            is_deleted: false,
            subscriptions: {
              some: {
                status: 'true',
                plan: { name: 'B2B' },
              },
            },
          },
        }),
      ],
    );

    return {
      totalUsers,
      activeUsers,
      premiumUsers,
      b2bUsers,
    };
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
    const passwordHash = await hashPassword(user.password);

    const data: {
      organization_id?: number;
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

    try {
      return await this.prisma.user.create({
        data,
        select: this.userSelect(),
      });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
        throw error;
      }
      if (error.code === 'P2002' && error.meta?.modelName === 'User') {
        throw new BadRequestException('EMAIL_ALREADY_USED');
      }
      if (error.code === 'P2003' && error.meta?.modelName === 'User') {
        throw new BadRequestException('ORGANIZATION_NOT_FOUND');
      }
      throw error;
    }
  }

  async updateUser(id: string, user: UpdateUserDto): Promise<User> {
    await this.getUserById(id);
    const data: {
      email?: string;
      first_name?: string;
      last_name?: string;
      height?: number;
      organization_id?: number;
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
