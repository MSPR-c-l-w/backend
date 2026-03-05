/* eslint-disable @typescript-eslint/no-base-to-string */
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import type { PipelineId } from './etl.service';

type UpdateStagingStatus = 'APPROVED' | 'REJECTED';

export interface StagingRow {
  id: string;
  cleaned_data: Record<string, unknown>;
  status: string;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class EtlStagingService {
  constructor(private readonly prisma: PrismaService) {}

  async findPendingWithoutAnomalies(
    pipeline: PipelineId,
    search?: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ items: StagingRow[]; total: number }> {
    const emptyAnomalies: Prisma.JsonArray = [];
    let list: StagingRow[] = [];

    if (pipeline === 'nutrition') {
      const rows = await this.prisma.nutritionStaging.findMany({
        where: {
          status: 'PENDING',
          anomalies: { equals: emptyAnomalies },
        },
        orderBy: { created_at: 'asc' },
      });
      list = this.mapRows(rows, search, (r) => {
        const d = r.cleaned_data as Record<string, unknown>;
        const name = d?.name;
        const category = d?.category;
        return [
          typeof name === 'string' ? name : '',
          typeof category === 'string' ? category : '',
        ].join(' ');
      });
    } else if (pipeline === 'exercise') {
      const rows = await this.prisma.exerciseStaging.findMany({
        where: {
          status: 'PENDING',
          anomalies: { equals: emptyAnomalies },
        },
        orderBy: { created_at: 'asc' },
      });
      list = this.mapRows(rows, search, (r) => {
        const d = r.cleaned_data as Record<string, unknown>;
        const name = d?.name;
        return typeof name === 'string' ? name : '';
      });
    } else if (pipeline === 'health-profile') {
      const rows = await this.prisma.healthProfileStaging.findMany({
        where: {
          status: 'PENDING',
          anomalies: { equals: emptyAnomalies },
        },
        orderBy: { created_at: 'asc' },
      });
      list = this.mapRows(rows, search, (r) => {
        const d = r.cleaned_data as Record<string, unknown>;
        const uid = d?.user_id;
        const bmi = d?.bmi;
        const pal = d?.physical_activity_level;
        return [
          uid != null ? String(uid) : '',
          bmi != null ? String(bmi) : '',
          typeof pal === 'string' ? pal : '',
        ].join(' ');
      });
    }

    const total = list.length;
    const start = (page - 1) * limit;
    const items = list.slice(start, start + limit);
    return { items, total };
  }

  private mapRows<
    T extends {
      id: string;
      cleaned_data: unknown;
      status: string;
      created_at: Date;
      updated_at: Date;
    },
  >(
    rows: T[],
    search: string | undefined,
    toSearchText: (r: T) => string,
  ): StagingRow[] {
    const list: StagingRow[] = rows.map((r) => ({
      id: r.id,
      cleaned_data: r.cleaned_data as Record<string, unknown>,
      status: r.status,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      const byId = new Map(rows.map((r) => [r.id, r]));
      return list.filter((r) => {
        const original = byId.get(r.id);
        return original
          ? toSearchText(original).toLowerCase().includes(q)
          : false;
      });
    }

    return list;
  }

  async updateStatus(
    pipeline: PipelineId,
    ids: string[],
    status: UpdateStagingStatus,
  ): Promise<number> {
    if (ids.length === 0) return 0;

    if (status === 'APPROVED') {
      return this.applyApprovedToFinal(pipeline, ids);
    }

    // Gestion simple des rejets : on met juste le statut à REJECTED
    if (pipeline === 'nutrition') {
      const result = await this.prisma.nutritionStaging.updateMany({
        where: { id: { in: ids } },
        data: { status },
      });
      return result.count;
    }

    if (pipeline === 'exercise') {
      const result = await this.prisma.exerciseStaging.updateMany({
        where: { id: { in: ids } },
        data: { status },
      });
      return result.count;
    }

    if (pipeline === 'health-profile') {
      const result = await this.prisma.healthProfileStaging.updateMany({
        where: { id: { in: ids } },
        data: { status },
      });
      return result.count;
    }

    return 0;
  }

  private async applyApprovedToFinal(
    pipeline: PipelineId,
    ids: string[],
  ): Promise<number> {
    if (pipeline === 'nutrition') {
      const rows = await this.prisma.nutritionStaging.findMany({
        where: { id: { in: ids } },
      });

      for (const row of rows) {
        const data = row.cleaned_data as Record<string, unknown>;
        if (!data || typeof data !== 'object') continue;

        const name = data.name as string | undefined;
        const category = data.category as string | undefined;
        if (!name || !category) continue;

        await this.prisma.nutrition.upsert({
          where: {
            name_category: {
              name,
              category,
            },
          },
          update: {
            name,
            category,
            calories_kcal: data.calories_kcal as number,
            protein_g: data.protein_g as number,
            carbohydrates_g: data.carbohydrates_g as number,
            fat_g: data.fat_g as number,
            fiber_g: data.fiber_g as number,
            sugar_g: data.sugar_g as number,
            sodium_mg: data.sodium_mg as number,
            cholesterol_mg: data.cholesterol_mg as number,
            meal_type_name: (data.meal_type_name ?? 'Autre') as string,
            water_intake_ml: data.water_intake_ml as number,
            picture_url: (data.picture_url as string | null) ?? null,
          },
          create: {
            name,
            category,
            calories_kcal: data.calories_kcal as number,
            protein_g: data.protein_g as number,
            carbohydrates_g: data.carbohydrates_g as number,
            fat_g: data.fat_g as number,
            fiber_g: data.fiber_g as number,
            sugar_g: data.sugar_g as number,
            sodium_mg: data.sodium_mg as number,
            cholesterol_mg: data.cholesterol_mg as number,
            meal_type_name: (data.meal_type_name ?? 'Autre') as string,
            water_intake_ml: data.water_intake_ml as number,
            picture_url: (data.picture_url as string | null) ?? null,
          },
        });
      }

      const result = await this.prisma.nutritionStaging.updateMany({
        where: { id: { in: ids } },
        data: { status: 'APPROVED' },
      });

      return result.count;
    }

    if (pipeline === 'exercise') {
      const rows = await this.prisma.exerciseStaging.findMany({
        where: { id: { in: ids } },
      });

      for (const row of rows) {
        const data = row.cleaned_data as Record<string, unknown>;
        if (!data || typeof data !== 'object') continue;

        const name = data.name as string | undefined;
        if (!name) continue;

        await this.prisma.exercise.upsert({
          where: { name },
          update: {
            name,
            primary_muscles: data.primary_muscles as Prisma.InputJsonValue,
            secondary_muscles: data.secondary_muscles as Prisma.InputJsonValue,
            level: (data.level as string | null) ?? null,
            mechanic: (data.mechanic as string | null) ?? null,
            equipment: (data.equipment as string | null) ?? null,
            category: (data.category as string | null) ?? null,
            instructions: data.instructions as Prisma.InputJsonValue,
            image_urls: data.image_urls as Prisma.InputJsonValue,
            exercise_type: (data.exercise_type as string | null) ?? null,
          },
          create: {
            name,
            primary_muscles: data.primary_muscles as Prisma.InputJsonValue,
            secondary_muscles: data.secondary_muscles as Prisma.InputJsonValue,
            level: (data.level as string | null) ?? null,
            mechanic: (data.mechanic as string | null) ?? null,
            equipment: (data.equipment as string | null) ?? null,
            category: (data.category as string | null) ?? null,
            instructions: data.instructions as Prisma.InputJsonValue,
            image_urls: data.image_urls as Prisma.InputJsonValue,
            exercise_type: (data.exercise_type as string | null) ?? null,
          },
        });
      }

      const result = await this.prisma.exerciseStaging.updateMany({
        where: { id: { in: ids } },
        data: { status: 'APPROVED' },
      });

      return result.count;
    }

    if (pipeline === 'health-profile') {
      const rows = await this.prisma.healthProfileStaging.findMany({
        where: { id: { in: ids } },
      });

      for (const row of rows) {
        const data = row.cleaned_data as Record<string, unknown>;
        if (!data || typeof data !== 'object') continue;

        const userId = data.user_id as number | undefined;
        if (!userId) continue;

        const weight = data.weight as number | null | undefined;
        const bmi = data.bmi as number | null | undefined;
        const pal = data.physical_activity_level as string | null | undefined;
        const dailyCalories = data.daily_calories_target as
          | number
          | null
          | undefined;

        await this.prisma.healthProfile.upsert({
          where: { user_id: userId },
          update: {
            weight: weight ?? null,
            bmi: bmi ?? null,
            physical_activity_level: pal ?? null,
            daily_calories_target: dailyCalories ?? null,
          },
          create: {
            user_id: userId,
            weight: weight ?? null,
            bmi: bmi ?? null,
            physical_activity_level: pal ?? null,
            daily_calories_target: dailyCalories ?? null,
          },
        });
      }

      const result = await this.prisma.healthProfileStaging.updateMany({
        where: { id: { in: ids } },
        data: { status: 'APPROVED' },
      });

      return result.count;
    }

    return 0;
  }
}
