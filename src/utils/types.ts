export type User = {
    id: number;
    organization_id: number | null;
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
}

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
}

export type ExerciseLog = {
    id: number;
    user_id: number;
    exercise_id: number;
    session_duration_h: number;
    calories_burned: number;
    max_bpm: number;
    avg_bpm: number;
    resting_bpm: number;
    created_at: Date;
}