import type { Prisma } from '@prisma/client';

export type UserAiPreferencesRecord = {
  id: number;
  user_id: number;
  allergies: Prisma.JsonValue;
  regime: string | null;
  budget: number | null;
  objectif_ia: string;
  contraintes_materielles: Prisma.JsonValue;
  updated_at: Date;
};
