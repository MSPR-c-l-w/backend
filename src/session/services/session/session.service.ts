/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { ISessionService } from 'src/session/interfaces/session/session.interface';
import { Session } from '@prisma/client';

@Injectable()
export class SessionService implements ISessionService {
  constructor(private readonly prisma: PrismaService) {}
  findAllByUser(userId: number): Promise<Session[]> {
    throw new Error('Method not implemented.');
  }
  findOne(id: number): Promise<Session> {
    throw new Error('Method not implemented.');
  }

  async getUserSummary(userId: number): Promise<any> {
    const stats = await this.prisma.session.aggregate({
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
    const stats = await this.prisma.session.aggregate({
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

  async getIntensityStats(userId: number): Promise<any> {
    return await this.prisma.session.aggregate({
      where: { user_id: userId },
      _avg: { avg_bpm: true, max_bpm: true, calories_total: true },
      _max: { max_bpm: true },
    });
  }

  async getSessions(userId: number, date?: string): Promise<Session[]> {
    const where: any = { user_id: userId };

    if (date) {
      const isMonthOnly = date.length === 7;
      const start = new Date(isMonthOnly ? `${date}-01` : date);
      const end = new Date(start);

      if (isMonthOnly) {
        end.setMonth(end.getMonth() + 1);
      } else {
        end.setHours(23, 59, 59, 999);
      }

      where.created_at = {
        gte: start,
        lt: end,
      };
    }

    return await this.prisma.session.findMany({
      where,
      include: {
        sessionExercises: { include: { exercise: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 10,
    });
  }

  async getSessionById(id: number): Promise<Session> {
    const session = await this.prisma.session.findUnique({
      where: { id },
      include: {
        sessionExercises: {
          include: { exercise: true },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`La séance ${id} n'existe pas.`);
    }
    return session;
  }

  async getSessionByUserIdAndId(userId: number, id: number): Promise<Session> {
    const session = await this.prisma.session.findFirst({
      where: { id, user_id: userId },
      include: {
        sessionExercises: {
          include: { exercise: true },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(
        `La séance ${id} n'existe pas ou ne vous appartient pas.`,
      );
    }
    return session;
  }

  private getDayRange(date?: string) {
    if (!date) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      return { start, end, dateString: start.toISOString().slice(0, 10) };
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('INVALID_DATE_FORMAT');
    }
    const start = new Date(`${date}T00:00:00.000`);
    if (Number.isNaN(start.getTime())) {
      throw new BadRequestException('INVALID_DATE');
    }
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end, dateString: date };
  }

  async getTodaySummary(userId: number, date?: string) {
    const { start, end, dateString } = this.getDayRange(date);

    const stats = await this.prisma.session.aggregate({
      where: {
        user_id: userId,
        created_at: { gte: start, lt: end },
      },
      _sum: { calories_total: true, duration_h: true },
      _count: { id: true },
    });

    const sessions = await this.prisma.session.findMany({
      where: {
        user_id: userId,
        created_at: { gte: start, lt: end },
      },
      select: { avg_bpm: true, max_bpm: true, duration_h: true },
    });

    let weightedSum = 0;
    let weightTotal = 0;
    for (const s of sessions) {
      const max = s.max_bpm ?? 0;
      const avg = s.avg_bpm ?? 0;
      const w = s.duration_h ?? 0;
      if (max > 0 && avg > 0 && w > 0) {
        weightedSum += (avg / max) * 100 * w;
        weightTotal += w;
      }
    }

    const avgIntensity =
      weightTotal > 0 ? Math.round(weightedSum / weightTotal) : 0;

    return {
      total_sessions_today: stats._count.id,
      total_duration_h: parseFloat((stats._sum.duration_h || 0).toFixed(2)),
      total_calories_burned: Math.round(stats._sum.calories_total || 0),
      average_intensity_percent: avgIntensity,
      date: dateString,
    };
  }
}
