import { Session } from '@prisma/client';

export interface ISessionService {
  getUserSummary(userId: number): Promise<any>;
  getUserLevel(userId: number): Promise<any>;

  getIntensityStats(userId: number): Promise<any>;

  getSessions(userId: number, date?: string): Promise<Session[]>;
  getSessionById(id: number): Promise<Session>;

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

export interface ISessionController {
  getDashboard(userId: number): Promise<any>;
  getLevel(userId: number): Promise<any>;
  getIntensity(userId: number): Promise<any>;

  getHistory(userId: number): Promise<Session[]>;
  getSessionById(id: number): Promise<Session>;

  getTodaySummary(req: any, date?: string): Promise<any>;
}
