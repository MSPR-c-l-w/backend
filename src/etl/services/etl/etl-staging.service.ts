/* eslint-disable @typescript-eslint/no-base-to-string */
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import type { PipelineId } from './etl.service';

export type StagingStatus = 'APPROVED' | 'REJECTED';

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
    status: StagingStatus,
  ): Promise<number> {
    if (ids.length === 0) return 0;

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
}
