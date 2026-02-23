/* eslint-disable prettier/prettier */
import { Role } from '@prisma/client';
import { CreateRoleDto, UpdateRoleDto } from 'src/role/dtos/role.dto';

export interface IRoleController {
  getRoles(): Promise<Role[]>;
  getRoleById(id: string): Promise<Role>;
  createRole(role: CreateRoleDto): Promise<Role>;
  updateRole(id: string, role: UpdateRoleDto): Promise<Role>;
  deleteRole(id: string): Promise<Role>;
}

export interface IRoleService {
  getRoles(): Promise<Role[]>;
  getRoleById(id: string): Promise<Role>;
  createRole(role: CreateRoleDto): Promise<Role>;
  updateRole(id: string, role: UpdateRoleDto): Promise<Role>;
  deleteRole(id: string): Promise<Role>;
}
