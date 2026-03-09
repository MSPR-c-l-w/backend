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

/** Configuration de marque (couleurs, logo, etc.) d'une organisation */
export type BrandingConfig = {
  primaryColor?: string;
  logoUrl?: string;
  [key: string]: string | undefined;
};

export type Organization = {
  id: number;
  name: string;
  type: string;
  branding_config: BrandingConfig;
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

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
};
