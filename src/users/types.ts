import type { User } from 'src/utils/types';

export type PaginatedUsersResponse = {
  data: User[];
  total: number;
};
