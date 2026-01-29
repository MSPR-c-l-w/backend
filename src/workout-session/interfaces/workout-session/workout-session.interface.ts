import { WorkoutSession } from '@prisma/client';

export interface IWorkout_SessionService {
  // --- Dashboard & Gamification ---
  getUserSummary(userId: number): Promise<any>;
  getUserLevel(userId: number): Promise<any>;

  // --- Statistiques (KPIs) ---
  getIntensityStats(userId: number): Promise<any>;

  // --- Lecture de base (Noms mis à jour) ---
  getWorkoutSessions(userId: number): Promise<WorkoutSession[]>; // Ancien: findAllByUser
  getWorkoutSessionById(id: number): Promise<WorkoutSession>; // Ancien: findOne
}

export interface IWorkout_SessionController {
  // --- Stats & Dashboard ---
  getDashboard(userId: number): Promise<any>;
  getLevel(userId: number): Promise<any>;
  getIntensity(userId: number): Promise<any>;

  // --- Lecture (Noms mis à jour) ---
  getHistory(userId: number): Promise<WorkoutSession[]>;
  getSessionById(id: number): Promise<WorkoutSession>;
}
