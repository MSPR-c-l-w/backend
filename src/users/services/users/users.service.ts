import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { CreateUserDto } from 'src/users/dtos/create.user.dto';
import { UpdateUserDto } from 'src/users/dtos/update.user.dto';
import type { IUsersService } from 'src/users/interfaces/users.interface.js';
import { User } from 'src/utils/types';

@Injectable()
export class UsersService implements IUsersService {

    constructor(private readonly prisma: PrismaService) {}

    getUsers(): Promise<User[]> {
        return this.prisma.user.findMany();
    }
    
    getUserById(id: string): Promise<User> {
        return this.prisma.user.findUnique({
            where: {
                id: parseInt(id)
            }
        }) as Promise<User>;
    }

    async createUser(user: CreateUserDto): Promise<User> {
        const organizationId = user.organization_id;
        return await this.prisma.user.create({
            data: {
                ...(organizationId == null
                    ? {}
                    : { organization: { connect: { id: organizationId } } }),
                email: user.email,
                password_hash: user.password,
                first_name: user.first_name,
                last_name: user.last_name,
                date_of_birth: new Date(user.date_of_birth),
                gender: user.gender,
                height: user.height,
                is_active: true,
                is_deleted: false,
            }
        })
    }

    async updateUser(id: string, user: UpdateUserDto): Promise<User> {
        const { organization_id: organizationId, ...userData } = user;
        return await this.prisma.user.update({
            where: {
                id: parseInt(id)
            },
            data: {
                ...userData,
                ...(organizationId == null
                    ? {}
                    : { organization: { connect: { id: organizationId } } }),
            }
        })
    }

    async deleteUser(id: string): Promise<User> {
        return await this.prisma.user.update({
            where: {
                id: parseInt(id)
            },
            data: {
                is_deleted: true,
                deleted_at: new Date(),
                is_active: false,
            }
        })
    }

}
