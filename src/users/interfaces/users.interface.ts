import { User } from 'src/utils/types';
import { CreateUserDto } from '../dtos/create.user.dto';
import { UpdateUserDto } from '../dtos/update.user.dto';

export interface IUsersController {
  getUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User>;
  createUser(user: CreateUserDto): Promise<User>;
  updateUser(id: string, user: UpdateUserDto): Promise<User>;
  deleteUser(id: string): Promise<User>;
}

export interface IUsersService {
  getUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User>;
  createUser(user: CreateUserDto): Promise<User>;
  updateUser(id: string, user: UpdateUserDto): Promise<User>;
  deleteUser(id: string): Promise<User>;
}
