import { ExerciseLog } from '@prisma/client';

export interface IExercise_LogService {
  // --- Stats techniques sur les exercices ---
  getGlobalTopExercises(): Promise<any[]>;
  getTopExercises(userId: number): Promise<any[]>;

  // --- Pipeline ETL (Point d'entrée des données) ---
  runLogsImportPipeline(): Promise<number>;

  // --- Lecture brute ---
  getExerciseLogs(): Promise<any[]>;
  getExerciseLogById(id: number): Promise<any>;
}

export interface IExercise_LogController {
  triggerImport(): Promise<{ message: string; count: number }>;
  getGlobalTopExercises(): Promise<any[]>;
  getTopExercises(userId: number): Promise<any[]>;
  getExerciseLogs(): Promise<any[]>;
  getExerciseLogById(id: number): Promise<any>;
}