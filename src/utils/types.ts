/* eslint-disable prettier/prettier */
export type User = {
  id: number;
  organization_id: number | null;
  role_id: number | null;
  email: string;
  first_name: string;
  last_name: string;
  date_of_birth: Date | null;
  gender: string | null;
  height: number | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  is_active: boolean;
  is_deleted: boolean;
};

export type Organization = {
  id: number;
  name: string;
  type: string;
  branding_config: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  is_active: boolean;
  is_deleted: boolean;
};

export type SessionExercise = {
  session_id: number;
  exercise_id: number;
};
