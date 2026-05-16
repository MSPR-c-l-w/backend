/** Profil sportif envoyé au micro-service FastAPI (api-ia). */
export interface WorkoutUserProfile {
  objectif: string;
  niveau: string;
  materiel: string[];
  preferences: string[];
  limitations: string[];
}

/** Réponse brute du micro-service (`POST /recommendations/workout`). */
export interface WorkoutProgramFromMicroservice {
  programId: string;
  userId: number;
  statut: string;
  programme: WorkoutDayFromMicroservice[];
  generatedAt: string;
}

export interface WorkoutDayFromMicroservice {
  jour: string;
  isRestDay: boolean;
  estimatedSessionMinutes: number;
  exercices: WorkoutExerciseFromMicroservice[];
}

export interface WorkoutExerciseFromMicroservice {
  id: string;
  sets?: number | null;
  reps?: number | null;
  duree?: number | null;
  estimatedDurationMinutes: number;
}
