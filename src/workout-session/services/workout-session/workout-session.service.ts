import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { IWorkout_SessionService } from 'src/workout-session/interfaces/workout-session/workout-session.interface';
import { WorkoutSession } from '@prisma/client';

@Injectable()
export class Workout_SessionService implements IWorkout_SessionService {
  constructor(private readonly prisma: PrismaService) {}
  findAllByUser(userId: number): Promise<WorkoutSession[]> {
    throw new Error('Method not implemented.');
  }
  findOne(id: number): Promise<WorkoutSession> {
    throw new Error('Method not implemented.');
  }

  // --- Dashboard & Gamification ---

  async getUserSummary(userId: number): Promise<any> {
    const stats = await this.prisma.workoutSession.aggregate({
      where: { user_id: userId },
      _sum: { calories_total: true, duration_h: true },
      _avg: { avg_bpm: true },
      _count: { id: true },
    });

    return {
      total_calories: Math.round(stats._sum.calories_total || 0),
      total_hours: parseFloat((stats._sum.duration_h || 0).toFixed(2)),
      average_bpm: Math.round(stats._avg.avg_bpm || 0),
      total_sessions: stats._count.id,
    };
  }

  async getUserLevel(userId: number): Promise<any> {
    const stats = await this.prisma.workoutSession.aggregate({
      where: { user_id: userId },
      _sum: { calories_total: true },
    });

    const total = stats._sum.calories_total || 0;
    let level = 'Débutant';

    if (total > 50000) level = 'Légende';
    else if (total > 10000) level = 'Athlète';
    else if (total > 2000) level = 'Actif';

    return { level, total_calories: Math.round(total) };
  }

  // --- Statistiques (KPIs) ---

  async getIntensityStats(userId: number): Promise<any> {
    return await this.prisma.workoutSession.aggregate({
      where: { user_id: userId },
      _avg: { avg_bpm: true, max_bpm: true, calories_total: true },
      _max: { max_bpm: true },
    });
  }

  // --- Lecture de base (Renommées) ---

  /** Récupère toutes les séances */
  async getWorkoutSessions(userId: number): Promise<WorkoutSession[]> {
    return await this.prisma.workoutSession.findMany({
      where: { user_id: userId },
      include: {
        logs: {
          include: { exercise: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  /** Récupère une séance par son ID */
  async getWorkoutSessionById(id: number): Promise<WorkoutSession> {
    const session = await this.prisma.workoutSession.findUnique({
      where: { id },
      include: {
        logs: {
          include: { exercise: true },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`La séance ${id} n'existe pas.`);
    }
    return session;
  }
}
