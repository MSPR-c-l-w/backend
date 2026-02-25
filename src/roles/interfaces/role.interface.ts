import { Role } from '@prisma/client';

export const DEFAULT_ROLE_NAMES = ['ADMIN', 'COACH'] as const;
export type DefaultRoleName = (typeof DEFAULT_ROLE_NAMES)[number];

export interface IRoleController {
  getRoles(): Promise<Role[]>;
}

export interface IRoleService {
  getRoles(): Promise<Role[]>;
  seedDefaultRoles(): Promise<void>;
}
