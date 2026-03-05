import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import type { PipelineId } from 'src/etl/services/etl/etl.service';
import { ROUTES } from 'src/utils/constants';
import { EtlService } from 'src/etl/services/etl/etl.service';
import { EtlStagingService } from 'src/etl/services/etl-staging/etl-staging.service';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import type { Response } from 'express';

export type StagingStatus = 'APPROVED' | 'REJECTED';

export interface StagingRowDto {
  id: string;
  cleaned_data: Record<string, unknown>;
  anomalies: unknown[];
  status: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateStagingStatusDto {
  pipeline: PipelineId;
  ids: string[];
  status: StagingStatus;
}

export interface UpdateStagingCleanedDataDto {
  pipeline: PipelineId;
  id: string;
  cleaned_data: Record<string, unknown> | string;
}

type CsvRow = Record<string, unknown>;

export interface PipelineSummaryDto {
  anomalies: number;
  lastSync: string | null;
}

@Controller(ROUTES.ETL)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiTags(ROUTES.ETL)
@ApiBearerAuth('access-token')
export class EtlController {
  constructor(
    private readonly etlStagingService: EtlStagingService,
    private readonly etlService: EtlService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('pipelines/status')
  @ApiOperation({
    summary: "Retourne l'état d'exécution des pipelines ETL",
  })
  @ApiOkResponse({
    description:
      'Statut de chaque pipeline (true = en cours, false = libre pour lancement)',
  })
  getPipelinesStatus(): Record<PipelineId, boolean> {
    return this.etlService.getAllPipelineStatuses();
  }

  @Get('pipelines/summary')
  @ApiOperation({
    summary:
      'Retourne les métriques des pipelines (anomalies en attente et dernière sync)',
  })
  @ApiOkResponse({
    description: 'Métriques consolidées des pipelines ETL',
  })
  async getPipelinesSummary(): Promise<Record<PipelineId, PipelineSummaryDto>> {
    const emptyAnomalies: Prisma.JsonArray = [];

    const [nutritionAnomalies, exerciseAnomalies, healthProfileAnomalies] =
      await Promise.all([
        this.prisma.nutritionStaging.count({
          where: {
            status: 'PENDING',
            NOT: { anomalies: { equals: emptyAnomalies } },
          },
        }),
        this.prisma.exerciseStaging.count({
          where: {
            status: 'PENDING',
            NOT: { anomalies: { equals: emptyAnomalies } },
          },
        }),
        this.prisma.healthProfileStaging.count({
          where: {
            status: 'PENDING',
            NOT: { anomalies: { equals: emptyAnomalies } },
          },
        }),
      ]);

    const [nutritionMax, exerciseMax, healthProfileMax] = await Promise.all([
      this.prisma.nutritionStaging.aggregate({
        _max: { updated_at: true },
      }),
      this.prisma.exerciseStaging.aggregate({
        _max: { updated_at: true },
      }),
      this.prisma.healthProfileStaging.aggregate({
        _max: { updated_at: true },
      }),
    ]);

    return {
      nutrition: {
        anomalies: nutritionAnomalies,
        lastSync: nutritionMax._max.updated_at?.toISOString() ?? null,
      },
      exercise: {
        anomalies: exerciseAnomalies,
        lastSync: exerciseMax._max.updated_at?.toISOString() ?? null,
      },
      'health-profile': {
        anomalies: healthProfileAnomalies,
        lastSync: healthProfileMax._max.updated_at?.toISOString() ?? null,
      },
    };
  }

  @Get('staging')
  @ApiOperation({
    summary:
      'Liste les lignes de staging sans anomalies (PENDING) pour validation',
  })
  @ApiQuery({
    name: 'pipeline',
    required: true,
    enum: ['nutrition', 'exercise', 'health-profile'],
    description: 'Pipeline concerné',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Recherche dans cleaned_data (nom, catégorie, etc.)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Numéro de page (défaut: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Nombre de lignes par page (défaut: 20)',
  })
  @ApiOkResponse({
    description: 'Liste paginée des lignes staging sans anomalies',
  })
  async getStagingPendingWithoutAnomalies(
    @Query('pipeline') pipeline: PipelineId,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{ items: StagingRowDto[]; total: number }> {
    const pageNum = Math.max(1, parseInt(String(page || '1'), 10) || 1);
    const limitNum = Math.min(
      10000,
      Math.max(1, parseInt(String(limit || '20'), 10) || 20),
    );
    const { items, total } =
      await this.etlStagingService.findPendingWithoutAnomalies(
        pipeline,
        search,
        pageNum,
        limitNum,
      );
    return {
      items: items.map((r) => ({
        id: r.id,
        cleaned_data: r.cleaned_data,
        anomalies: r.anomalies,
        status: r.status,
        created_at: r.created_at.toISOString(),
        updated_at: r.updated_at.toISOString(),
      })),
      total,
    };
  }

  @Get('staging/anomalies')
  @ApiOperation({
    summary:
      'Liste les lignes de staging avec anomalies (PENDING) pour correction',
  })
  @ApiQuery({
    name: 'pipeline',
    required: true,
    enum: ['nutrition', 'exercise', 'health-profile'],
    description: 'Pipeline concerné',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Recherche dans cleaned_data (nom, catégorie, etc.)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Numéro de page (défaut: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Nombre de lignes par page (défaut: 20)',
  })
  @ApiOkResponse({
    description: 'Liste paginée des lignes staging avec anomalies',
  })
  async getStagingPendingWithAnomalies(
    @Query('pipeline') pipeline: PipelineId,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{ items: StagingRowDto[]; total: number }> {
    const pageNum = Math.max(1, parseInt(String(page || '1'), 10) || 1);
    const limitNum = Math.min(
      10000,
      Math.max(1, parseInt(String(limit || '20'), 10) || 20),
    );
    const { items, total } =
      await this.etlStagingService.findPendingWithAnomalies(
        pipeline,
        search,
        pageNum,
        limitNum,
      );
    return {
      items: items.map((r) => ({
        id: r.id,
        cleaned_data: r.cleaned_data,
        anomalies: r.anomalies,
        status: r.status,
        created_at: r.created_at.toISOString(),
        updated_at: r.updated_at.toISOString(),
      })),
      total,
    };
  }

  @Get('export/final')
  @ApiOperation({
    summary:
      'Exporte en CSV les données de la table finale pour un pipeline donné',
  })
  @ApiQuery({
    name: 'pipeline',
    required: true,
    enum: ['nutrition', 'exercise', 'health-profile'],
    description: 'Pipeline concerné (table finale exportée)',
  })
  @ApiOkResponse({
    description: 'Contenu CSV des données validées en base finale',
  })
  async exportFinalDatasetAsCsv(
    @Query('pipeline') pipeline: PipelineId,
    @Res({ passthrough: true }) response: Response,
  ): Promise<string> {
    const rows = await this.getFinalRowsForPipeline(pipeline);
    const csv = this.toCsv(rows);
    const date = new Date().toISOString().slice(0, 10);
    const filename = `${pipeline}-final-${date}.csv`;

    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );

    return csv;
  }

  @Patch('staging/status')
  @ApiOperation({
    summary: 'Met à jour le statut de lignes staging (Accepter / Rejeter)',
  })
  @ApiOkResponse({ description: 'Statut mis à jour' })
  async updateStagingStatus(
    @Body() body: UpdateStagingStatusDto,
  ): Promise<{ updated: number }> {
    const updated = await this.etlStagingService.updateStatus(
      body.pipeline,
      body.ids,
      body.status,
    );
    return { updated };
  }

  @Patch('staging/cleaned-data')
  @ApiOperation({
    summary:
      'Met à jour cleaned_data d’une ligne staging puis relance les détecteurs d’anomalies',
  })
  @ApiOkResponse({
    description: 'Ligne staging mise à jour avec anomalies recalculées',
  })
  async updateStagingCleanedData(
    @Body() body: UpdateStagingCleanedDataDto,
  ): Promise<{ item: StagingRowDto }> {
    const row = await this.etlStagingService.updateCleanedDataAndRecheck(
      body.pipeline,
      body.id,
      body.cleaned_data,
    );
    return {
      item: {
        id: row.id,
        cleaned_data: row.cleaned_data,
        anomalies: row.anomalies,
        status: row.status,
        created_at: row.created_at.toISOString(),
        updated_at: row.updated_at.toISOString(),
      },
    };
  }

  private async getFinalRowsForPipeline(
    pipeline: PipelineId,
  ): Promise<CsvRow[]> {
    if (pipeline === 'nutrition') {
      const rows = await this.prisma.nutrition.findMany({
        orderBy: { id: 'asc' },
      });
      return rows.map((row) => ({ ...row }));
    }

    if (pipeline === 'exercise') {
      const rows = await this.prisma.exercise.findMany({
        orderBy: { id: 'asc' },
      });
      return rows.map((row) => ({ ...row }));
    }

    if (pipeline === 'health-profile') {
      const rows = await this.prisma.healthProfile.findMany({
        orderBy: { id: 'asc' },
      });
      return rows.map((row) => ({ ...row }));
    }

    throw new BadRequestException('Pipeline ETL invalide.');
  }

  private toCsv(rows: CsvRow[]): string {
    if (rows.length === 0) {
      return '';
    }

    const headers = Array.from(
      rows.reduce((set, row) => {
        Object.keys(row).forEach((key) => set.add(key));
        return set;
      }, new Set<string>()),
    );

    const lines = [
      headers.join(','),
      ...rows.map((row) =>
        headers.map((header) => this.escapeCsvValue(row[header])).join(','),
      ),
    ];

    return lines.join('\n');
  }

  private escapeCsvValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    let normalized = '';
    if (typeof value === 'string') {
      normalized = value;
    } else if (
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      typeof value === 'bigint'
    ) {
      normalized = value.toString();
    } else if (value instanceof Date) {
      normalized = value.toISOString();
    } else if (typeof value === 'object') {
      normalized = JSON.stringify(value);
    }

    const escaped = normalized.replace(/"/g, '""');
    return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
  }
}
