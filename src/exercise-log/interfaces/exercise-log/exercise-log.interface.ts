import { ExerciseLog } from '@prisma/client';

export interface IExerciseLogController {
  getExerciseLogs(): Promise<ExerciseLog[]>;
  getExerciseLogById(id: string): Promise<ExerciseLog>;
}

export interface IExerciseLogService {
  getExerciseLogs(): Promise<ExerciseLog[]>;
  getExerciseLogById(id: string): Promise<ExerciseLog>;
}
