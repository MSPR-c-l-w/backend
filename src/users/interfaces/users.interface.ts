import { User } from 'src/utils/types';
import { CreateUserDto } from '../dtos/create.user.dto';
import { UpdateUserDto } from '../dtos/update.user.dto';
import { UpdateUserRoleDto } from '../dtos/update-user-role.dto';
import { GetUsersDto } from '../dtos/get.users.dto';

export type PaginatedUsersResponse = {
  data: User[];
  total: number;
};

export interface IUsersController {
  getUsers(query?: GetUsersDto): Promise<User[] | PaginatedUsersResponse>;
  getUserById(id: string): Promise<User>;
  createUser(user: CreateUserDto): Promise<User>;
  updateUser(id: string, user: UpdateUserDto): Promise<User>;
  updateUserRole(id: string, userRole: UpdateUserRoleDto): Promise<User>;
  deleteUser(id: string): Promise<User>;
}

export interface IUsersService {
  getUsers(query?: GetUsersDto): Promise<User[] | PaginatedUsersResponse>;
  getUserById(id: string): Promise<User>;
  createUser(user: CreateUserDto): Promise<User>;
  updateUser(id: string, user: UpdateUserDto): Promise<User>;
  updateUserRole(id: string, userRole: UpdateUserRoleDto): Promise<User>;
  deleteUser(id: string): Promise<User>;
}
