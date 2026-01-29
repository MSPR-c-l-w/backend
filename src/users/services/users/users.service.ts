import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { CreateUserDto } from 'src/users/dtos/create.user.dto';
import { UpdateUserDto } from 'src/users/dtos/update.user.dto';
import type { IUsersService } from 'src/users/interfaces/users.interface.js';
import { User } from 'src/utils/types';
import { hashPassword } from 'src/utils/security/password';

@Injectable()
export class UsersService implements IUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getUsers(): Promise<User[]> {
    const users = (await this.prisma.user.findMany({
      select: {
        id: true,
        organization_id: true,
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
      },
    })) as User[];

    if (users.length === 0) {
      throw new NotFoundException('NO_USERS_FOUND');
    }

    return users;
  }

  async getUserById(id: string): Promise<User> {
    const user = (await this.prisma.user.findUnique({
      where: {
        id: parseInt(id),
      },
      select: {
        id: true,
        organization_id: true,
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
      },
    })) as User | null;

    if (!user || user.is_deleted) {
      throw new NotFoundException('USER_NOT_FOUND');
    }

    return user;
  }

  async createUser(user: CreateUserDto): Promise<User> {
    const organizationId = user.organization_id;
    const passwordHash = await hashPassword(user.password);
    return await this.prisma.user.create({
      data: {
        ...(organizationId == null
          ? {}
          : { organization: { connect: { id: organizationId } } }),
        email: user.email,
        password_hash: passwordHash,
        first_name: user.first_name,
        last_name: user.last_name,
        date_of_birth: new Date(user.date_of_birth),
        gender: user.gender,
        height: user.height,
        is_active: true,
        is_deleted: false,
      },
      select: {
        id: true,
        organization_id: true,
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
      },
    });
  }

  async updateUser(id: string, user: UpdateUserDto): Promise<User> {
    await this.getUserById(id);
    const { organization_id: organizationId, ...userData } = user;
    return await this.prisma.user.update({
      where: {
        id: parseInt(id),
      },
      data: {
        ...userData,
        ...(organizationId == null
          ? {}
          : { organization: { connect: { id: organizationId } } }),
      },
      select: {
        id: true,
        organization_id: true,
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
      },
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
      select: {
        id: true,
        organization_id: true,
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
      },
    });
  }
}
