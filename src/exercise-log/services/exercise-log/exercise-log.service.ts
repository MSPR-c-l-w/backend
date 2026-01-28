import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ExerciseLog } from '@prisma/client';
import { IExercise_LogService } from 'src/exercise-log/interfaces/exercise-log/exercise-log.interface';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import * as Papa from 'papaparse';

@Injectable()
export class Exercise_LogService implements IExercise_LogService {
  private readonly logger = new Logger(Exercise_LogService.name);

  private readonly KAGGLE_USER = process.env.KAGGLE_USER;
  private readonly KAGGLE_KEY = process.env.KAGGLE_KEY;
  private readonly DATASET_URL = 'https://www.kaggle.com/api/v1/datasets/download/valakhorasani/gym-members-exercise-dataset/gym_members_exercise_tracking.csv';

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}

  // --- STATS & DASHBOARD ---

  async getGlobalTopExercises(): Promise<any[]> {
    const groups = await (this.prisma.exerciseLog as any).groupBy({
      by: ['exercise_id'],
      _count: { exercise_id: true },
      orderBy: { _count: { exercise_id: 'desc' } },
      take: 5,
    });
    // On récupère les détails des exos manuellement car groupBy ne supporte pas include
    return Promise.all(groups.map(async (g) => ({
      ...g,
      exercise: await this.prisma.exercise.findUnique({ where: { id: g.exercise_id } })
    })));
  }

  async getTopExercises(userId: number): Promise<any[]> {
    const groups = await (this.prisma.exerciseLog as any).groupBy({
      by: ['exercise_id'],
      where: { user_id: userId },
      _count: { exercise_id: true },
      orderBy: { _count: { exercise_id: 'desc' } },
      take: 5,
    });
    return Promise.all(groups.map(async (g) => ({
      ...g,
      exercise: await this.prisma.exercise.findUnique({ where: { id: g.exercise_id } })
    })));
  }

  async getUserSummary(userId: number): Promise<any> {
    const stats = await this.prisma.exerciseLog.aggregate({
      where: { user_id: userId },
      _sum: { calories_burned: true, session_duration_h: true },
      _avg: { avg_bpm: true },
      _count: { id: true }
    });
    return {
      total_calories: Math.round(stats._sum.calories_burned || 0),
      total_hours: parseFloat((stats._sum.session_duration_h || 0).toFixed(2)),
      average_bpm: Math.round(stats._avg.avg_bpm || 0),
      total_sessions: stats._count.id
    };
  }

  async getUserLevel(userId: number): Promise<any> {
    const stats = await this.prisma.exerciseLog.aggregate({
      where: { user_id: userId },
      _sum: { calories_burned: true }
    });
    const total = stats._sum.calories_burned || 0;
    let level = 'Débutant';
    if (total > 50000) level = 'Légende';
    else if (total > 10000) level = 'Athlète';
    else if (total > 2000) level = 'Actif';
    return { level, total_calories: Math.round(total) };
  }

  async getIntensityStats(userId: number): Promise<any> {
    return await this.prisma.exerciseLog.aggregate({
      where: { user_id: userId },
      _avg: { avg_bpm: true, max_bpm: true, calories_burned: true },
      _max: { max_bpm: true },
    });
  }

  // --- PIPELINE ETL KAGGLE (MULTI-EXERCISES) ---

  async runLogsImportPipeline(): Promise<number> {
    try {
      await this.prisma.user.upsert({
        where: { id: 1 },
        update: {},
        create: {
          id: 1,
          email: 'admin@test.fr',
          password_hash: 'hash_temporaire',
          first_name: 'Antoine',
          last_name: 'Wacq',
        },
      });

      const auth = Buffer.from(`${this.KAGGLE_USER}:${this.KAGGLE_KEY}`).toString('base64');
      const response = await lastValueFrom(
        this.httpService.get(this.DATASET_URL, {
          headers: { Authorization: `Basic ${auth}`, Accept: 'application/octet-stream' },
          responseType: 'text',
        }),
      );

      const parsed = Papa.parse(response.data, { header: true, skipEmptyLines: true, dynamicTyping: true });
      const rows = parsed.data as any[];
      const allExos = await this.prisma.exercise.findMany({ select: { id: true } });

      // On vide les anciens logs pour repartir sur une base propre multi-exos
      await this.prisma.exerciseLog.deleteMany({});

      let logCounter = 1;

      for (const [index, row] of rows.entries()) {
        // Chaque ligne CSV = 1 séance, mais on enregistre 3 exercices différents pour cette séance
        // On garde les vraies valeurs de la séance pour chaque exercice
        for (let i = 0; i < 3; i++) {
          const exId = allExos[(index + i) % allExos.length].id;

          await this.prisma.exerciseLog.create({
            data: {
              id: logCounter,
              user_id: 1,
              exercise_id: exId,
              session_duration_h: row['Session_Duration (hours)'] || 0,
              calories_burned: row['Calories_Burned'] || 0,
              max_bpm: row['Max_BPM'] || 0,
              avg_bpm: row['Avg_BPM'] || 0,
              resting_bpm: row['Resting_BPM'] || 0,
            },
          });
          logCounter++;
        }
      }
      return logCounter - 1;
    } catch (e) {
      this.logger.error(`Erreur ETL: ${e.message}`);
      throw e;
    }
  }

  // --- LECTURE ---

  async getExerciseLogs(): Promise<ExerciseLog[]> {
    return await this.prisma.exerciseLog.findMany({ include: { exercise: true } });
  }

  async getExerciseLogById(id: number): Promise<ExerciseLog> {
    const log = await this.prisma.exerciseLog.findUnique({ where: { id }, include: { exercise: true } });
    if (!log) throw new NotFoundException(`Log ${id} introuvable`);
    return log;
  }

  private async findExerciseIdByName(name: string): Promise<number> {
    const exercise = await this.prisma.exercise.findFirst({
      where: { OR: [{ name: { contains: name } }, { category: { contains: name } }] },
    });
    return exercise?.id || 1;
  }
}