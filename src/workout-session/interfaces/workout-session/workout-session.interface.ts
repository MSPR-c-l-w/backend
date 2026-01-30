import { WorkoutSession } from '@prisma/client';

export interface IWorkout_SessionService {
  getUserSummary(userId: number): Promise<any>;
  getUserLevel(userId: number): Promise<any>;
  getIntensityStats(userId: number): Promise<any>;
  getWorkoutSessions(userId: number, date?: string): Promise<WorkoutSession[]>;
  getWorkoutSessionById(id: number): Promise<WorkoutSession>;
}

export interface IWorkout_SessionController {
  getDashboard(userId: number): Promise<any>;
  getLevel(userId: number): Promise<any>;
  getIntensity(userId: number): Promise<any>;
  getHistory(userId: number): Promise<WorkoutSession[]>;
  getSessionById(id: number): Promise<WorkoutSession>;
}
