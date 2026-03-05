/* eslint-disable @typescript-eslint/no-base-to-string */
import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import type { PipelineId } from '../etl/etl.service';
import { EtlAnomalyDetectorService } from '../etl-anomaly-detector/etl-anomaly-detector.service';

type UpdateStagingStatus = 'APPROVED' | 'REJECTED';

export interface StagingRow {
  id: string;
  cleaned_data: Record<string, unknown>;
  anomalies: Prisma.JsonArray;
  status: string;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class EtlStagingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly anomalyDetector: EtlAnomalyDetectorService,
  ) {}

  async findPendingWithoutAnomalies(
    pipeline: PipelineId,
    search?: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ items: StagingRow[]; total: number }> {
    const emptyAnomalies: Prisma.JsonArray = [];
    let list: StagingRow[] = [];

    const rows = await this.findPendingRows(pipeline, emptyAnomalies, false);
    list = this.mapRows(rows, search, (r) => this.toSearchText(r, pipeline));

    const total = list.length;
    const start = (page - 1) * limit;
    const items = list.slice(start, start + limit);
    return { items, total };
  }

  async findPendingWithAnomalies(
    pipeline: PipelineId,
    search?: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ items: StagingRow[]; total: number }> {
    const emptyAnomalies: Prisma.JsonArray = [];
    const rows = await this.findPendingRows(pipeline, emptyAnomalies, true);
    const list = this.mapRows(rows, search, (r) =>
      this.toSearchText(r, pipeline),
    );
    const total = list.length;
    const start = (page - 1) * limit;
    const items = list.slice(start, start + limit);
    return { items, total };
  }

  private mapRows<
    T extends {
      id: string;
      cleaned_data: unknown;
      anomalies: unknown;
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
      anomalies: (r.anomalies as Prisma.JsonArray) ?? [],
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

  async updateCleanedDataAndRecheck(
    pipeline: PipelineId,
    id: string,
    cleanedDataInput: unknown,
  ): Promise<StagingRow> {
    const parsedCleanedData =
      this.parseAndValidateCleanedData(cleanedDataInput);
    const anomalies = this.anomalyDetector.detectForPipeline(
      pipeline,
      parsedCleanedData,
    );

    if (pipeline === 'nutrition') {
      const row = await this.prisma.nutritionStaging.update({
        where: { id },
        data: {
          cleaned_data: parsedCleanedData as Prisma.InputJsonValue,
          anomalies,
          status: 'PENDING',
        },
      });
      return this.toStagingRow(row);
    }

    if (pipeline === 'exercise') {
      const row = await this.prisma.exerciseStaging.update({
        where: { id },
        data: {
          cleaned_data: parsedCleanedData as Prisma.InputJsonValue,
          anomalies,
          status: 'PENDING',
        },
      });
      return this.toStagingRow(row);
    }

    const row = await this.prisma.healthProfileStaging.update({
      where: { id },
      data: {
        cleaned_data: parsedCleanedData as Prisma.InputJsonValue,
        anomalies,
        status: 'PENDING',
      },
    });
    return this.toStagingRow(row);
  }

  private async applyApprovedToFinal(
    pipeline: PipelineId,
    ids: string[],
  ): Promise<number> {
    if (pipeline === 'nutrition') {
      const rows = await this.prisma.nutritionStaging.findMany({
        where: { id: { in: ids } },
      });

      const approvedIds: string[] = [];
      for (const row of rows) {
        const data = row.cleaned_data as Record<string, unknown>;
        if (!data || typeof data !== 'object') continue;
        const anomalies = this.anomalyDetector.detectForPipeline(
          'nutrition',
          data,
        );
        if (anomalies.length > 0) {
          await this.prisma.nutritionStaging.update({
            where: { id: row.id },
            data: {
              anomalies,
              status: 'PENDING',
            },
          });
          continue;
        }

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
        approvedIds.push(row.id);
      }

      if (approvedIds.length === 0) return 0;
      const result = await this.prisma.nutritionStaging.updateMany({
        where: { id: { in: approvedIds } },
        data: { status: 'APPROVED' },
      });
      return result.count;
    }

    if (pipeline === 'exercise') {
      const rows = await this.prisma.exerciseStaging.findMany({
        where: { id: { in: ids } },
      });

      const approvedIds: string[] = [];
      for (const row of rows) {
        const data = row.cleaned_data as Record<string, unknown>;
        if (!data || typeof data !== 'object') continue;
        const anomalies = this.anomalyDetector.detectForPipeline(
          'exercise',
          data,
        );
        if (anomalies.length > 0) {
          await this.prisma.exerciseStaging.update({
            where: { id: row.id },
            data: {
              anomalies,
              status: 'PENDING',
            },
          });
          continue;
        }

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
        approvedIds.push(row.id);
      }

      if (approvedIds.length === 0) return 0;
      const result = await this.prisma.exerciseStaging.updateMany({
        where: { id: { in: approvedIds } },
        data: { status: 'APPROVED' },
      });
      return result.count;
    }

    if (pipeline === 'health-profile') {
      const rows = await this.prisma.healthProfileStaging.findMany({
        where: { id: { in: ids } },
      });

      const approvedIds: string[] = [];
      for (const row of rows) {
        const data = row.cleaned_data as Record<string, unknown>;
        if (!data || typeof data !== 'object') continue;
        const anomalies = this.anomalyDetector.detectForPipeline(
          'health-profile',
          data,
        );
        if (anomalies.length > 0) {
          await this.prisma.healthProfileStaging.update({
            where: { id: row.id },
            data: {
              anomalies,
              status: 'PENDING',
            },
          });
          continue;
        }

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
        approvedIds.push(row.id);
      }

      if (approvedIds.length === 0) return 0;
      const result = await this.prisma.healthProfileStaging.updateMany({
        where: { id: { in: approvedIds } },
        data: { status: 'APPROVED' },
      });
      return result.count;
    }

    return 0;
  }

  private parseAndValidateCleanedData(
    cleanedDataInput: unknown,
  ): Record<string, unknown> {
    let parsed: unknown = cleanedDataInput;
    if (typeof cleanedDataInput === 'string') {
      try {
        parsed = JSON.parse(cleanedDataInput);
      } catch {
        throw new BadRequestException(
          'JSON invalide : erreur de syntaxe lors du parsing.',
        );
      }
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new BadRequestException(
        'cleaned_data doit être un objet JSON valide.',
      );
    }

    return parsed as Record<string, unknown>;
  }

  private async findPendingRows(
    pipeline: PipelineId,
    emptyAnomalies: Prisma.JsonArray,
    withAnomalies: boolean,
  ): Promise<
    Array<{
      id: string;
      cleaned_data: unknown;
      anomalies: unknown;
      status: string;
      created_at: Date;
      updated_at: Date;
    }>
  > {
    if (pipeline === 'nutrition') {
      return await this.prisma.nutritionStaging.findMany({
        where: withAnomalies
          ? {
              status: 'PENDING',
              NOT: { anomalies: { equals: emptyAnomalies } },
            }
          : {
              status: 'PENDING',
              anomalies: { equals: emptyAnomalies },
            },
        orderBy: { created_at: 'asc' },
      });
    }
    if (pipeline === 'exercise') {
      return await this.prisma.exerciseStaging.findMany({
        where: withAnomalies
          ? {
              status: 'PENDING',
              NOT: { anomalies: { equals: emptyAnomalies } },
            }
          : {
              status: 'PENDING',
              anomalies: { equals: emptyAnomalies },
            },
        orderBy: { created_at: 'asc' },
      });
    }
    return await this.prisma.healthProfileStaging.findMany({
      where: withAnomalies
        ? {
            status: 'PENDING',
            NOT: { anomalies: { equals: emptyAnomalies } },
          }
        : {
            status: 'PENDING',
            anomalies: { equals: emptyAnomalies },
          },
      orderBy: { created_at: 'asc' },
    });
  }

  private toSearchText(
    row: { cleaned_data: unknown },
    pipeline: PipelineId,
  ): string {
    const d = row.cleaned_data as Record<string, unknown>;
    if (pipeline === 'nutrition') {
      const name = d?.name;
      const category = d?.category;
      return [
        typeof name === 'string' ? name : '',
        typeof category === 'string' ? category : '',
      ].join(' ');
    }
    if (pipeline === 'exercise') {
      const name = d?.name;
      return typeof name === 'string' ? name : '';
    }
    const uid = d?.user_id;
    const bmi = d?.bmi;
    const pal = d?.physical_activity_level;
    return [
      uid != null ? String(uid) : '',
      bmi != null ? String(bmi) : '',
      typeof pal === 'string' ? pal : '',
    ].join(' ');
  }

  private toStagingRow(row: {
    id: string;
    cleaned_data: unknown;
    anomalies: unknown;
    status: string;
    created_at: Date;
    updated_at: Date;
  }): StagingRow {
    return {
      id: row.id,
      cleaned_data: row.cleaned_data as Record<string, unknown>,
      anomalies: (row.anomalies as Prisma.JsonArray) ?? [],
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
