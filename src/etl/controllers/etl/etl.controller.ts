import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import type { PipelineId } from 'src/etl/services/etl/etl.service';
import { ROUTES } from 'src/utils/constants';
import { EtlStagingService } from 'src/etl/services/etl/etl-staging.service';

export type StagingStatus = 'APPROVED' | 'REJECTED';

export interface StagingRowDto {
  id: string;
  cleaned_data: Record<string, unknown>;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateStagingStatusDto {
  pipeline: PipelineId;
  ids: string[];
  status: StagingStatus;
}

@Controller(ROUTES.ETL)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiTags(ROUTES.ETL)
@ApiBearerAuth('access-token')
export class EtlController {
  constructor(private readonly etlStagingService: EtlStagingService) {}

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
        status: r.status,
        created_at: r.created_at.toISOString(),
        updated_at: r.updated_at.toISOString(),
      })),
      total,
    };
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
}
