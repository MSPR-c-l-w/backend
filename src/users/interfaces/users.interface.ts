import type { Request } from 'express';
import type { User } from 'src/utils/types';
import type { CreateUserDto } from '../dtos/create.user.dto';
import type { UpdateUserDto } from '../dtos/update.user.dto';
import type { UpdateUserRoleDto } from '../dtos/update-user-role.dto';
import type { GetUsersDto } from '../dtos/get.users.dto';
import type { UpdateAiPreferencesDto } from '../dtos/update-ai-preferences.dto';
import type { UserAiPreferencesRecord } from './user-ai-preferences.interface';
import type { DataExportResponse } from './data-export.interface';
import type { PaginatedUsersResponse } from '../types';

export type { PaginatedUsersResponse };

export interface IUsersController {
  getUsers(query?: GetUsersDto): Promise<User[] | PaginatedUsersResponse>;
  getUserById(id: string): Promise<User>;
  createUser(user: CreateUserDto): Promise<User>;
  updateUser(id: string, user: UpdateUserDto): Promise<User>;
  updateUserRole(id: string, userRole: UpdateUserRoleDto): Promise<User>;
  deleteUser(id: string): Promise<User>;
  updateMyAiPreferences(
    req: Request,
    preferences: UpdateAiPreferencesDto,
  ): Promise<UserAiPreferencesRecord>;
  updateMe(
    req: Request,
    dto: { first_name: string; last_name: string },
  ): Promise<{ user: { first_name: string; last_name: string } }>;
  deleteMe(req: Request, dto: { password: string }): Promise<void>;
  requestDataExport(req: Request): Promise<DataExportResponse>;
}

export interface IUsersService {
  getUsersStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    premiumUsers: number;
    b2bUsers: number;
  }>;
  getUsers(query?: GetUsersDto): Promise<User[] | PaginatedUsersResponse>;
  getUserById(id: string): Promise<User>;
  createUser(user: CreateUserDto): Promise<User>;
  updateUser(id: string, user: UpdateUserDto): Promise<User>;
  updateUserRole(id: string, userRole: UpdateUserRoleDto): Promise<User>;
  deleteUser(id: string): Promise<User>;
  updateMyAiPreferences(
    userId: string,
    preferences: UpdateAiPreferencesDto,
  ): Promise<UserAiPreferencesRecord>;
  updateMe(
    userId: number,
    first_name: string,
    last_name: string,
  ): Promise<{ first_name: string; last_name: string }>;
  deleteMe(userId: number, password: string): Promise<void>;
  requestDataExport(userId: number): Promise<DataExportResponse>;
}
