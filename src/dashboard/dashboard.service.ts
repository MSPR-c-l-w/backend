import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';

const EMPTY_ANOMALIES: Prisma.JsonArray = [];

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getPilotage() {
    const [
      totalUsers,
      activeUsers,
      premiumCount,
      b2bCount,
      ageGroups,
      objectivesRaw,
      pipelineSummary,
      dataQualityPct,
      dataQualityTrend,
    ] = await Promise.all([
      this.prisma.user.count({ where: { is_deleted: false } }),
      this.prisma.user.count({ where: { is_deleted: false, is_active: true } }),
      this.prisma.user.count({
        where: {
          is_deleted: false,
          subscriptions: {
            some: { status: 'true', plan: { name: 'Premium' } },
          },
        },
      }),
      this.prisma.user.count({
        where: {
          is_deleted: false,
          subscriptions: {
            some: { status: 'true', plan: { name: 'B2B' } },
          },
        },
      }),
      this.getAgeDistribution(),
      this.getObjectivesData(),
      this.getPipelinesSummary(),
      this.getDataQualityPct(),
      this.getDataQualityTrendFromDb(),
    ]);

    const totalAnomalies =
      pipelineSummary.nutrition.anomalies +
      pipelineSummary.exercise.anomalies +
      pipelineSummary['health-profile'].anomalies;

    const premiumPct =
      totalUsers > 0 ? ((premiumCount / totalUsers) * 100).toFixed(1) : '0';

    const dataQualityTrendFormatted =
      dataQualityTrend.length > 0
        ? dataQualityTrend
        : this.emptyDataQualityTrend();

    const objectivesData =
      objectivesRaw.length > 0 ? objectivesRaw : this.defaultObjectivesData();

    const alerts = this.buildAlertsFromDb(pipelineSummary);
    const dataQualityTrendLabel = this.getDataQualityTrendLabel(
      dataQualityPct,
      dataQualityTrend,
    );

    return {
      kpis: {
        dataQuality: {
          value: `${dataQualityPct.toFixed(1)}%`,
          trend: dataQualityTrendLabel,
        },
        activeUsers: {
          value: activeUsers.toLocaleString('fr-FR'),
          trend:
            totalUsers > 0
              ? `${((activeUsers / totalUsers) * 100).toFixed(1)}% actifs`
              : '0%',
        },
        premiumConversion: {
          value: `${premiumPct}%`,
          trend: '—',
        },
        pipelineErrors: {
          value: String(totalAnomalies),
          trend: '—',
        },
      },
      dataQualityTrend: dataQualityTrendFormatted,
      ageDistribution: ageGroups,
      objectivesData,
      alerts,
    };
  }

  /** Résumé ETL : anomalies en attente et dernière sync par pipeline (source BDD). */
  private async getPipelinesSummary(): Promise<{
    nutrition: { anomalies: number; lastSync: Date | null };
    exercise: { anomalies: number; lastSync: Date | null };
    'health-profile': { anomalies: number; lastSync: Date | null };
  }> {
    const whereAnomalies = {
      status: 'PENDING' as const,
      NOT: { anomalies: { equals: EMPTY_ANOMALIES } },
    };

    const [nutritionAnomalies, exerciseAnomalies, healthProfileAnomalies] =
      await Promise.all([
        this.prisma.nutritionStaging.count({ where: whereAnomalies }),
        this.prisma.exerciseStaging.count({ where: whereAnomalies }),
        this.prisma.healthProfileStaging.count({ where: whereAnomalies }),
      ]);

    const [nutritionMax, exerciseMax, healthProfileMax] = await Promise.all([
      this.prisma.nutritionStaging.aggregate({ _max: { updated_at: true } }),
      this.prisma.exerciseStaging.aggregate({ _max: { updated_at: true } }),
      this.prisma.healthProfileStaging.aggregate({
        _max: { updated_at: true },
      }),
    ]);

    return {
      nutrition: {
        anomalies: nutritionAnomalies,
        lastSync: nutritionMax._max.updated_at ?? null,
      },
      exercise: {
        anomalies: exerciseAnomalies,
        lastSync: exerciseMax._max.updated_at ?? null,
      },
      'health-profile': {
        anomalies: healthProfileAnomalies,
        lastSync: healthProfileMax._max.updated_at ?? null,
      },
    };
  }

  /** Qualité des données = % des lignes staging (PENDING) sans anomalies. */
  private async getDataQualityPct(): Promise<number> {
    const whereTotal = { status: 'PENDING' as const };
    const whereNoAnomalies = {
      status: 'PENDING' as const,
      anomalies: { equals: EMPTY_ANOMALIES },
    };

    const [total, withoutAnomalies] = await Promise.all([
      Promise.all([
        this.prisma.nutritionStaging.count({ where: whereTotal }),
        this.prisma.exerciseStaging.count({ where: whereTotal }),
        this.prisma.healthProfileStaging.count({ where: whereTotal }),
      ]).then(([a, b, c]) => a + b + c),
      Promise.all([
        this.prisma.nutritionStaging.count({ where: whereNoAnomalies }),
        this.prisma.exerciseStaging.count({ where: whereNoAnomalies }),
        this.prisma.healthProfileStaging.count({ where: whereNoAnomalies }),
      ]).then(([a, b, c]) => a + b + c),
    ]);

    if (total === 0) return 100;
    return (withoutAnomalies / total) * 100;
  }

  /** Tendance qualité sur 7 jours : pour chaque jour, qualité et erreurs depuis la BDD. */
  private async getDataQualityTrendFromDb(): Promise<
    { date: string; quality: number; errors: number }[]
  > {
    const dayLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const result: { date: string; quality: number; errors: number }[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);

      const range = { gte: start, lte: end };
      const whereTotal = { status: 'PENDING' as const, updated_at: range };
      const whereWithAnomalies = {
        status: 'PENDING' as const,
        updated_at: range,
        NOT: { anomalies: { equals: EMPTY_ANOMALIES } },
      };

      const [total, withAnomalies] = await Promise.all([
        Promise.all([
          this.prisma.nutritionStaging.count({ where: whereTotal }),
          this.prisma.exerciseStaging.count({ where: whereTotal }),
          this.prisma.healthProfileStaging.count({ where: whereTotal }),
        ]).then(([a, b, c]) => a + b + c),
        Promise.all([
          this.prisma.nutritionStaging.count({ where: whereWithAnomalies }),
          this.prisma.exerciseStaging.count({ where: whereWithAnomalies }),
          this.prisma.healthProfileStaging.count({ where: whereWithAnomalies }),
        ]).then(([a, b, c]) => a + b + c),
      ]);

      const quality = total === 0 ? 100 : ((total - withAnomalies) / total) * 100;
      result.push({
        date: dayLabels[i],
        quality: Math.round(quality * 10) / 10,
        errors: withAnomalies,
      });
    }

    return result;
  }

  private emptyDataQualityTrend(): {
    date: string;
    quality: number;
    errors: number;
  }[] {
    return ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((date) => ({
      date,
      quality: 0,
      errors: 0,
    }));
  }

  private defaultObjectivesData(): {
    name: string;
    value: number;
    color: string;
  }[] {
    return [
      { name: 'Perte de poids', value: 0, color: '#4A90E2' },
      { name: 'Prise de masse', value: 0, color: '#5CC58C' },
      { name: 'Bien-être', value: 0, color: '#7FD8BE' },
      { name: 'Performance', value: 0, color: '#FFB88C' },
    ];
  }

  /** Tendance en % (évolution qualité vs jour précédent) ; "—" si pas de données. */
  private getDataQualityTrendLabel(
    currentPct: number,
    trend: { quality: number }[],
  ): string {
    if (trend.length < 2) return '—';
    const prev = trend[trend.length - 2].quality;
    const curr = trend[trend.length - 1].quality;
    const diff = curr - prev;
    if (diff === 0) return '0%';
    const sign = diff > 0 ? '+' : '';
    return `${sign}${diff.toFixed(1)}%`;
  }

  /** Alertes construites depuis la BDD : anomalies + dernière sync par pipeline. */
  private buildAlertsFromDb(
    summary: {
      nutrition: { anomalies: number; lastSync: Date | null };
      exercise: { anomalies: number; lastSync: Date | null };
      'health-profile': { anomalies: number; lastSync: Date | null };
    },
  ): { id: number; type: string; message: string; time: string }[] {
    const alerts: { id: number; type: string; message: string; time: string }[] =
      [];
    let id = 1;

    const pipelines = [
      { key: 'nutrition' as const, label: 'Nutrition' },
      { key: 'exercise' as const, label: 'Exercice' },
      { key: 'health-profile' as const, label: 'Profil santé' },
    ] as const;

    for (const { key, label } of pipelines) {
      const { anomalies, lastSync } = summary[key];
      if (anomalies > 0) {
        alerts.push({
          id: id++,
          type: 'error',
          message: `${label} : ${anomalies} enregistrement(s) avec anomalies en attente`,
          time: lastSync ? this.formatTimeAgo(lastSync) : '—',
        });
      }
    }

    const lastSyncDates = pipelines
      .map(({ key }) => summary[key].lastSync)
      .filter((d): d is Date => d != null);
    const mostRecentSync =
      lastSyncDates.length > 0
        ? new Date(Math.max(...lastSyncDates.map((d) => d.getTime())))
        : null;

    if (mostRecentSync) {
      alerts.push({
        id: id++,
        type: 'success',
        message: 'Dernière synchronisation ETL',
        time: this.formatTimeAgo(mostRecentSync),
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        id: 1,
        type: 'success',
        message: 'Aucune alerte pipeline.',
        time: '—',
      });
    }

    return alerts;
  }

  private formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    const diffH = Math.floor(diffMin / 60);
    const diffJ = Math.floor(diffH / 24);

    if (diffMin < 1) return 'À l\'instant';
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    if (diffH < 24) return `Il y a ${diffH} h`;
    if (diffJ === 1) return 'Il y a 1 j';
    return `Il y a ${diffJ} j`;
  }

  private async getAgeDistribution(): Promise<{ name: string; value: number }[]> {
    const users = await this.prisma.user.findMany({
      where: { is_deleted: false, date_of_birth: { not: null } },
      select: { date_of_birth: true },
    });
    const bands = [
      { name: '18-25', min: 18, max: 25, value: 0 },
      { name: '26-35', min: 26, max: 35, value: 0 },
      { name: '36-45', min: 36, max: 45, value: 0 },
      { name: '46-55', min: 46, max: 55, value: 0 },
      { name: '56+', min: 56, max: 120, value: 0 },
    ];
    const today = new Date();
    for (const u of users) {
      if (!u.date_of_birth) continue;
      const age =
        today.getFullYear() - new Date(u.date_of_birth).getFullYear();
      const band = bands.find((b) => age >= b.min && age <= b.max);
      if (band) band.value++;
    }
    return bands.map(({ name, value }) => ({ name, value }));
  }

  private async getObjectivesData(): Promise<
    { name: string; value: number; color: string }[]
  > {
    const profiles = await this.prisma.healthProfile.groupBy({
      by: ['physical_activity_level'],
      _count: { id: true },
      where: { physical_activity_level: { not: null } },
    });
    const labels: Record<string, string> = {
      sedentary: 'Bien-être',
      light: 'Bien-être',
      moderate: 'Performance',
      active: 'Prise de masse',
      very_active: 'Performance',
    };
    const colors: Record<string, string> = {
      'Perte de poids': '#4A90E2',
      'Prise de masse': '#5CC58C',
      'Bien-être': '#7FD8BE',
      Performance: '#FFB88C',
    };
    const map: Record<string, number> = {};
    for (const p of profiles) {
      const label = labels[p.physical_activity_level ?? ''] ?? 'Bien-être';
      map[label] = (map[label] ?? 0) + p._count.id;
    }
    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
      color: colors[name] ?? '#4A90E2',
    }));
  }
}
