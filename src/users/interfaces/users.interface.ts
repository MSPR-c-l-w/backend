import type { User } from 'src/utils/types';
import type { CreateUserDto } from '../dtos/create.user.dto';
import type { UpdateUserDto } from '../dtos/update.user.dto';
import type { UpdateUserRoleDto } from '../dtos/update-user-role.dto';
import type { GetUsersDto } from '../dtos/get.users.dto';
import type { PaginatedUsersResponse } from '../types';

export type { PaginatedUsersResponse };

export interface IUsersController {
  getUsers(query?: GetUsersDto): Promise<User[] | PaginatedUsersResponse>;
  getUserById(id: string): Promise<User>;
  createUser(user: CreateUserDto): Promise<User>;
  updateUser(id: string, user: UpdateUserDto): Promise<User>;
  updateUserRole(id: string, userRole: UpdateUserRoleDto): Promise<User>;
  deleteUser(id: string): Promise<User>;
}

export interface IUsersService {
  getUsersStats(): Promise<{ totalUsers: number; activeUsers: number; premiumUsers: number; b2bUsers: number; }>;
  getUsers(query?: GetUsersDto): Promise<User[] | PaginatedUsersResponse>;
  getUserById(id: string): Promise<User>;
  createUser(user: CreateUserDto): Promise<User>;
  updateUser(id: string, user: UpdateUserDto): Promise<User>;
  updateUserRole(id: string, userRole: UpdateUserRoleDto): Promise<User>;
  deleteUser(id: string): Promise<User>;
}
