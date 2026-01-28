import { ExerciseLog } from '@prisma/client';

export interface IExercise_LogService {
  getGlobalTopExercises(): any[] | PromiseLike<any[]>;
  // --- Dashboard & Gamification ---
  getUserSummary(userId: number): Promise<any>;
  getUserLevel(userId: number): Promise<any>;

  // --- Statistiques (KPIs) ---
  // On met le userId optionnel (?) pour permettre le Top Global ET le Top Perso
  getTopExercises(userId?: number): Promise<any[]>;
  getIntensityStats(userId: number): Promise<any>;

  // --- Pipeline ETL Kaggle ---
  runLogsImportPipeline(): Promise<number>;

  // --- Lecture de base ---
  getExerciseLogs(): Promise<ExerciseLog[]>;
  getExerciseLogById(id: number): Promise<ExerciseLog>;
}

export interface IExercise_LogController {
  // --- Stats & Dashboard ---
  getDashboard(userId: number): Promise<any>;
  getLevel(userId: number): Promise<any>;
  
  // Routes pour les stats (Perso vs Global)
  getTopExercises(userId: number): Promise<any[]>;
  getGlobalTopExercises(): Promise<any[]>;
  getIntensity(userId: number): Promise<any>;

  // --- Actions ---
  triggerImport(): Promise<{ message: string; count: number }>;

  // --- Lecture ---
  getExerciseLogs(): Promise<ExerciseLog[]>;
  getExerciseLogById(id: number): Promise<ExerciseLog>;
}