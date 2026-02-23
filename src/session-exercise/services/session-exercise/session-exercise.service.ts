/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import * as Papa from 'papaparse';
import { ISessionExerciseService } from 'src/session-exercise/interfaces/session-exercise/session-exercise.interface';

@Injectable()
export class SessionExerciseService implements ISessionExerciseService {
  private readonly logger = new Logger(SessionExerciseService.name);
  private readonly KAGGLE_USER = process.env.KAGGLE_USER;
  private readonly KAGGLE_KEY = process.env.KAGGLE_KEY;
  private readonly DATASET_URL =
    'https://www.kaggle.com/api/v1/datasets/download/valakhorasani/gym-members-exercise-dataset/gym_members_exercise_tracking.csv';

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}

  async runLogsImportPipeline(): Promise<number> {
    try {
      await this.prisma.user.upsert({
        where: { id: 1 },
        update: {},
        create: {
          id: 1,
          email: 'admin@test.fr',
          password_hash: 'hash',
          first_name: 'Antoine',
          last_name: 'Wacq',
        },
      });

      const auth = Buffer.from(
        `${this.KAGGLE_USER}:${this.KAGGLE_KEY}`,
      ).toString('base64');
      const response = await lastValueFrom(
        this.httpService.get(this.DATASET_URL, {
          headers: {
            Authorization: `Basic ${auth}`,
            Accept: 'application/octet-stream',
          },
          responseType: 'text',
        }),
      );

      const parsed = Papa.parse(response.data, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
      });
      const rows = parsed.data as any[];
      const allExos = await this.prisma.exercise.findMany({
        select: { id: true },
      });
      if (allExos.length === 0) {
        throw new BadRequestException(
          'NO_EXERCISES_FOUND_IMPORT_EXERCISES_FIRST',
        );
      }

      await this.prisma.sessionExercise.deleteMany({});
      await this.prisma.session.deleteMany({});

      for (const [index, row] of rows.entries()) {
        const session = await this.prisma.session.create({
          data: {
            user_id: 1,
            duration_h: row['Session_Duration (hours)'] || 0,
            calories_total: Math.round(row['Calories_Burned'] || 0),
            avg_bpm: row['Avg_BPM'] || 0,
            max_bpm: row['Max_BPM'] || 0,
          },
        });

        const linkedExercisesCount = Math.min(3, allExos.length);
        for (let i = 0; i < linkedExercisesCount; i++) {
          const exId = allExos[(index + i) % allExos.length].id;
          await this.prisma.sessionExercise.create({
            data: {
              exercise_id: exId,
              session_id: session.id,
            },
          });
        }
      }
      return rows.length;
    } catch (e) {
      this.logger.error(`Erreur ETL: ${e.message}`);
      throw e;
    }
  }

  async getGlobalTopExercises(): Promise<any[]> {
    const groups = await (this.prisma.sessionExercise as any).groupBy({
      by: ['exercise_id'],
      _count: { exercise_id: true },
      orderBy: { _count: { exercise_id: 'desc' } },
      take: 5,
    });
    return Promise.all(
      groups.map(async (g) => ({
        ...g,
        exercise: await this.prisma.exercise.findUnique({
          where: { id: g.exercise_id },
        }),
      })),
    );
  }

  async getTopExercises(userId: number): Promise<any[]> {
    const groups = await (this.prisma.sessionExercise as any).groupBy({
      by: ['exercise_id'],
      where: { session: { user_id: userId } },
      _count: { exercise_id: true },
      orderBy: { _count: { exercise_id: 'desc' } },
      take: 5,
    });
    return Promise.all(
      groups.map(async (g) => ({
        ...g,
        exercise: await this.prisma.exercise.findUnique({
          where: { id: g.exercise_id },
        }),
      })),
    );
  }

  async getSessionExercises(): Promise<any[]> {
    return await this.prisma.sessionExercise.findMany({
      include: { exercise: true, session: true },
    });
  }

  async getSessionExerciseById(
    sessionId: number,
    exerciseId: number,
  ): Promise<any> {
    const log = await this.prisma.sessionExercise.findUnique({
      where: {
        session_id_exercise_id: {
          session_id: sessionId,
          exercise_id: exerciseId,
        },
      },
      include: { exercise: true, session: true },
    });
    if (!log) {
      throw new NotFoundException(
        `SessionExercise (${sessionId}, ${exerciseId}) introuvable`,
      );
    }
    return log;
  }
}
