import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import {
  DemographicsConversion,
  EngagementSummary,
  EngagementTimeseriesPoint,
  IAnalyticsService,
  NutritionTrendItem,
  ProgressionPoint,
} from 'src/analytics/interfaces/analytics.interface';

@Injectable()
export class AnalyticsService implements IAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getEngagementSummary(days = 7): Promise<EngagementSummary> {
    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - days + 1);

    const [totalUsers, sessions, activeUsersCount] =
      await this.prisma.$transaction([
        this.prisma.user.count({
          where: { is_deleted: false },
        }),
        this.prisma.session.findMany({
          where: {
            created_at: {
              gte: from,
              lte: now,
            },
          },
          select: {
            user_id: true,
            duration_h: true,
            calories_total: true,
            avg_bpm: true,
            max_bpm: true,
          },
        }),
        this.prisma.session.groupBy({
          by: ['user_id'],
          where: {
            created_at: {
              gte: from,
              lte: now,
            },
          },
          _count: { id: true },
          orderBy: undefined,
        }),
      ]);

    if (totalUsers === 0 || sessions.length === 0) {
      return {
        days,
        averageDailyActivityMinutesPerUser: 0,
        averageDailyCaloriesBurnedPerUser: 0,
        averageIntensityPercent: 0,
        totalActiveUsers: 0,
      };
    }

    const totalDurationH = sessions.reduce(
      (sum, s) => sum + (s.duration_h ?? 0),
      0,
    );
    const totalCalories = sessions.reduce(
      (sum, s) => sum + (s.calories_total ?? 0),
      0,
    );

    const activeUsers = activeUsersCount.length;
    const safeActiveUsers = activeUsers || totalUsers;

    const averageDailyActivityMinutesPerUser =
      (totalDurationH * 60) / days / safeActiveUsers;
    const averageDailyCaloriesBurnedPerUser =
      totalCalories / days / safeActiveUsers;

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

    const averageIntensityPercent =
      weightTotal > 0 ? weightedSum / weightTotal : 0;

    return {
      days,
      averageDailyActivityMinutesPerUser: Math.round(
        averageDailyActivityMinutesPerUser,
      ),
      averageDailyCaloriesBurnedPerUser: Math.round(
        averageDailyCaloriesBurnedPerUser,
      ),
      averageIntensityPercent: Math.round(averageIntensityPercent),
      totalActiveUsers: activeUsers,
    };
  }

  async getEngagementTimeseries(
    days = 30,
  ): Promise<EngagementTimeseriesPoint[]> {
    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - days + 1);

    const [totalUsers, sessions] = await this.prisma.$transaction([
      this.prisma.user.count({
        where: { is_deleted: false },
      }),
      this.prisma.session.findMany({
        where: {
          created_at: {
            gte: from,
            lte: now,
          },
        },
        select: {
          user_id: true,
          duration_h: true,
          calories_total: true,
          created_at: true,
        },
      }),
    ]);

    if (totalUsers === 0) {
      return [];
    }

    const byDay = new Map<
      string,
      {
        duration: number;
        calories: number;
        users: Set<number>;
      }
    >();

    for (const s of sessions) {
      const key = s.created_at.toISOString().slice(0, 10);
      let entry = byDay.get(key);
      if (!entry) {
        entry = { duration: 0, calories: 0, users: new Set<number>() };
        byDay.set(key, entry);
      }
      entry.duration += s.duration_h ?? 0;
      entry.calories += s.calories_total ?? 0;
      entry.users.add(s.user_id);
    }

    const result: EngagementTimeseriesPoint[] = [];
    const usersWithAtLeastOneSession = new Set<number>();
    for (const day of byDay.values()) {
      for (const userId of day.users) {
        usersWithAtLeastOneSession.add(userId);
      }
    }
    const totalActiveInPeriod = usersWithAtLeastOneSession.size || totalUsers;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const entry = byDay.get(key);
      const activeUsers = entry?.users.size ?? 0;
      result.push({
        date: key,
        totalDurationHours: entry?.duration ?? 0,
        totalCalories: Math.round(entry?.calories ?? 0),
        activeUsersPercent:
          totalActiveInPeriod > 0
            ? Math.round((activeUsers / totalActiveInPeriod) * 100)
            : 0,
      });
    }

    return result;
  }

  async getProgression(weeks = 8): Promise<ProgressionPoint[]> {
    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - weeks * 7);

    const [totalUsers, sessions] = await this.prisma.$transaction([
      this.prisma.user.count({
        where: { is_deleted: false },
      }),
      this.prisma.session.findMany({
        where: {
          created_at: {
            gte: from,
            lte: now,
          },
        },
        select: {
          user_id: true,
          calories_total: true,
          created_at: true,
        },
      }),
    ]);

    if (totalUsers === 0 || sessions.length === 0) {
      return [];
    }

    const byWeek = new Map<
      string,
      {
        totalCalories: number;
        sessionsByUser: Map<number, number>;
      }
    >();

    const getWeekKey = (d: Date): string => {
      const date = new Date(
        Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()),
      );
      const dayNum = date.getUTCDay() || 7;
      date.setUTCDate(date.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil(
        ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
      );
      return `${date.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
    };

    for (const s of sessions) {
      const key = getWeekKey(s.created_at);
      let entry = byWeek.get(key);
      if (!entry) {
        entry = { totalCalories: 0, sessionsByUser: new Map<number, number>() };
        byWeek.set(key, entry);
      }
      entry.totalCalories += s.calories_total ?? 0;
      entry.sessionsByUser.set(
        s.user_id,
        (entry.sessionsByUser.get(s.user_id) ?? 0) + 1,
      );
    }

    const sortedKeys = Array.from(byWeek.keys()).sort();
    const result: ProgressionPoint[] = [];
    const TARGET_DAILY_CALORIES = 400;

    for (const key of sortedKeys.slice(-weeks)) {
      const entry = byWeek.get(key);
      if (!entry) continue;
      const weeklyActiveUsers = entry.sessionsByUser.size || totalUsers;
      const avgDailyCaloriesPerActiveUser =
        entry.totalCalories / (7 * weeklyActiveUsers);
      const progressionRaw =
        TARGET_DAILY_CALORIES > 0
          ? avgDailyCaloriesPerActiveUser / TARGET_DAILY_CALORIES
          : 0;
      const progressionPercent = Math.max(
        0,
        Math.min(100, Math.round(progressionRaw * 100)),
      );

      const activeUsersWithThreshold = Array.from(
        entry.sessionsByUser.values(),
      ).filter((count) => count >= 2).length;
      const satisfactionPercent =
        weeklyActiveUsers > 0
          ? Math.round((activeUsersWithThreshold / weeklyActiveUsers) * 100)
          : 0;

      result.push({
        week: key,
        progressionPercent,
        satisfactionPercent,
      });
    }

    return result;
  }

  async getDemographicsConversion(): Promise<DemographicsConversion> {
    const [users, plans, subscriptions] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: { is_deleted: false },
        select: {
          id: true,
          date_of_birth: true,
          gender: true,
        },
      }),
      this.prisma.plan.findMany({
        select: { id: true, name: true },
      }),
      this.prisma.subscription.findMany({
        select: { user_id: true, plan_id: true },
      }),
    ]);

    const ageBuckets = [
      { label: '18-24', min: 18, max: 24 },
      { label: '25-34', min: 25, max: 34 },
      { label: '35-44', min: 35, max: 44 },
      { label: '45-54', min: 45, max: 54 },
      { label: '55+', min: 55, max: 120 },
    ];

    const bucketMap = new Map<
      string,
      {
        label: string;
        total: number;
        male: number;
        female: number;
        other: number;
      }
    >();
    for (const b of ageBuckets) {
      bucketMap.set(b.label, {
        label: b.label,
        total: 0,
        male: 0,
        female: 0,
        other: 0,
      });
    }

    const now = new Date();
    for (const u of users) {
      if (!u.date_of_birth) continue;
      const age =
        now.getFullYear() -
        u.date_of_birth.getFullYear() -
        (now <
        new Date(
          now.getFullYear(),
          u.date_of_birth.getMonth(),
          u.date_of_birth.getDate(),
        )
          ? 1
          : 0);

      const bucket = ageBuckets.find((b) => age >= b.min && age <= b.max);
      if (!bucket) continue;
      const slot = bucketMap.get(bucket.label);
      if (!slot) continue;
      slot.total += 1;
      const gender = (u.gender ?? '').toLowerCase();
      if (gender.startsWith('homme') || gender === 'm') {
        slot.male += 1;
      } else if (gender.startsWith('femme') || gender === 'f') {
        slot.female += 1;
      } else {
        slot.other += 1;
      }
    }

    const userPlan = new Map<number, number | null>();
    for (const u of users) {
      userPlan.set(u.id, null);
    }
    for (const sub of subscriptions) {
      if (!userPlan.has(sub.user_id)) continue;
      if (userPlan.get(sub.user_id) == null) {
        userPlan.set(sub.user_id, sub.plan_id);
      }
    }

    const planById = new Map<number, string>();
    for (const p of plans) {
      planById.set(p.id, p.name);
    }

    const planConversionMap = new Map<string, number>();
    for (const [, planId] of userPlan.entries()) {
      const name =
        planId == null ? 'Sans abonnement' : (planById.get(planId) ?? 'Autre');
      planConversionMap.set(name, (planConversionMap.get(name) ?? 0) + 1);
    }

    const ageBucketsResult = Array.from(bucketMap.values());
    const planConversion = Array.from(planConversionMap.entries()).map(
      ([name, usersCount]) => ({
        name,
        users: usersCount,
      }),
    );

    return {
      ageBuckets: ageBucketsResult,
      planConversion,
    };
  }

  async getNutritionTrends(): Promise<NutritionTrendItem[]> {
    const meals = await this.prisma.meal.findMany({
      select: {
        user_id: true,
        nutrition: {
          select: {
            calories_kcal: true,
            protein_g: true,
          },
        },
      },
    });

    if (meals.length === 0) {
      return [];
    }

    const perUser = new Map<
      number,
      { totalCalories: number; totalProtein: number; meals: number }
    >();

    for (const m of meals) {
      const entry = perUser.get(m.user_id) ?? {
        totalCalories: 0,
        totalProtein: 0,
        meals: 0,
      };
      entry.totalCalories += m.nutrition.calories_kcal;
      entry.totalProtein += m.nutrition.protein_g;
      entry.meals += 1;
      perUser.set(m.user_id, entry);
    }

    const profiles = {
      hyperProteine: {
        profile: 'Hyper-protéiné',
        users: 0,
        totalCalories: 0,
        totalProtein: 0,
      },
      equilibre: {
        profile: 'Équilibré',
        users: 0,
        totalCalories: 0,
        totalProtein: 0,
      },
      hyperGlucide: {
        profile: 'Hyper-glucidique',
        users: 0,
        totalCalories: 0,
        totalProtein: 0,
      },
    };

    for (const [, stats] of perUser.entries()) {
      const avgCalories = stats.totalCalories / stats.meals;
      const avgProtein = stats.totalProtein / stats.meals;

      let bucket: keyof typeof profiles = 'equilibre';
      if (avgProtein >= 25) {
        bucket = 'hyperProteine';
      } else if (avgCalories >= 600) {
        bucket = 'hyperGlucide';
      }

      profiles[bucket].users += 1;
      profiles[bucket].totalCalories += avgCalories;
      profiles[bucket].totalProtein += avgProtein;
    }

    const result: NutritionTrendItem[] = [];
    for (const key of Object.keys(profiles) as Array<keyof typeof profiles>) {
      const p = profiles[key];
      if (p.users === 0) continue;
      result.push({
        profile: p.profile,
        users: p.users,
        avgCalories: Math.round(p.totalCalories / p.users),
        avgProtein: Math.round(p.totalProtein / p.users),
      });
    }

    return result;
  }
}
