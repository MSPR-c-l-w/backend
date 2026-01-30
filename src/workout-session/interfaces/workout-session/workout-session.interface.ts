import { WorkoutSession } from '@prisma/client';

export interface IWorkout_SessionService {
  getUserSummary(userId: number): Promise<any>;
  getUserLevel(userId: number): Promise<any>;

  getIntensityStats(userId: number): Promise<any>;

  getWorkoutSessions(userId: number): Promise<WorkoutSession[]>;
  getWorkoutSessionById(id: number): Promise<WorkoutSession>;

  getTodaySummary(
    userId: number,
    date?: string,
  ): Promise<{
    total_sessions_today: number;
    total_duration_h: number;
    total_calories_burned: number;
    average_intensity_percent: number;
    date: string;
  }>;
}

export interface IWorkout_SessionController {
  getDashboard(userId: number): Promise<any>;
  getLevel(userId: number): Promise<any>;
  getIntensity(userId: number): Promise<any>;

  getHistory(userId: number): Promise<WorkoutSession[]>;
  getSessionById(id: number): Promise<WorkoutSession>;

  getTodaySummary(req: any, date?: string): Promise<any>;
}
