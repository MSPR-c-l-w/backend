import { ExerciseLog } from '@prisma/client';

export interface IExercise_LogController {
  getExerciseLogs(): Promise<ExerciseLog[]>;
  getExerciseLogById(id: string): Promise<ExerciseLog>;
}

export interface IExercise_LogService {
  getExerciseLogs(): Promise<ExerciseLog[]>;
  getExerciseLogById(id: string): Promise<ExerciseLog>;
}
