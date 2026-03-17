import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import {
  IAnalyticsController,
  EngagementSummary,
  EngagementTimeseriesPoint,
  ProgressionPoint,
  DemographicsConversion,
  NutritionTrendItem,
  type IAnalyticsService,
} from 'src/analytics/interfaces/analytics.interface';
import {
  type ApiLogsDashboardDto,
  type ApiLogsRange,
} from 'src/analytics/interfaces/api-logs.interface';
import { ROUTES, SERVICES } from 'src/utils/constants';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ApiLogsService } from 'src/analytics/services/api-logs/api-logs.service';

@ApiBearerAuth('access-token')
@ApiTags(ROUTES.ANALYTICS)
@UseGuards(JwtAuthGuard)
@Controller(ROUTES.ANALYTICS)
export class AnalyticsController implements IAnalyticsController {
  constructor(
    @Inject(SERVICES.ANALYTICS)
    private readonly analyticsService: IAnalyticsService,
    private readonly apiLogsService: ApiLogsService,
  ) {}

  @Get('engagement/summary')
  @ApiOperation({ summary: "Résumé d'engagement global" })
  @ApiOkResponse({ description: "Résumé d'engagement calculé sur la période" })
  @ApiQuery({ name: 'days', required: false, type: Number })
  getEngagementSummary(
    @Query('days') days?: string,
  ): Promise<EngagementSummary> {
    const parsed = days ? Number.parseInt(days, 10) : undefined;
    return this.analyticsService.getEngagementSummary(parsed);
  }

  @Get('engagement/timeseries')
  @ApiOperation({
    summary:
      "Série temporelle d'engagement (activité / calories / utilisateurs actifs)",
  })
  @ApiOkResponse({ description: "Données d'engagement par jour" })
  @ApiQuery({ name: 'days', required: false, type: Number })
  getEngagementTimeseries(
    @Query('days') days?: string,
  ): Promise<EngagementTimeseriesPoint[]> {
    const parsed = days ? Number.parseInt(days, 10) : undefined;
    return this.analyticsService.getEngagementTimeseries(parsed);
  }

  @Get('progression')
  @ApiOperation({ summary: 'Progression moyenne et satisfaction par semaine' })
  @ApiOkResponse({ description: 'Données agrégées par semaine' })
  @ApiQuery({ name: 'weeks', required: false, type: Number })
  getProgression(@Query('weeks') weeks?: string): Promise<ProgressionPoint[]> {
    const parsed = weeks ? Number.parseInt(weeks, 10) : undefined;
    return this.analyticsService.getProgression(parsed);
  }

  @Get('demographics-conversion')
  @ApiOperation({ summary: 'Répartition démographique et conversion par plan' })
  @ApiOkResponse({ description: 'Données démographiques et de conversion' })
  getDemographicsConversion(): Promise<DemographicsConversion> {
    return this.analyticsService.getDemographicsConversion();
  }

  @Get('nutrition-trends')
  @ApiOperation({ summary: 'Tendances nutritionnelles par profil utilisateur' })
  @ApiOkResponse({ description: 'Profils nutritionnels agrégés' })
  getNutritionTrends(): Promise<NutritionTrendItem[]> {
    return this.analyticsService.getNutritionTrends();
  }

  @Get('api-logs/dashboard')
  @ApiOperation({
    summary:
      'Données consolidées pour la page API & Logs (KPI, chart, endpoints, serveur)',
  })
  @ApiOkResponse({ description: 'Dashboard API & Logs' })
  @ApiQuery({
    name: 'range',
    required: false,
    enum: ['1h', '24h', '7j', '30j'],
    description: "Fenêtre d'analyse",
  })
  getApiLogsDashboard(
    @Query('range') range?: ApiLogsRange,
  ): ApiLogsDashboardDto {
    const normalized: ApiLogsRange =
      range === '1h' || range === '24h' || range === '7j' || range === '30j'
        ? range
        : '24h';
    return this.apiLogsService.getDashboard(normalized);
  }

  @Get('api-logs/server-status')
  @ApiOperation({
    summary: 'Statut machine temps réel (CPU/RAM/uptime/charge/requêtes-h)',
  })
  @ApiOkResponse({ description: 'Statut serveur (valeurs machine réelles)' })
  getApiLogsServerStatus(): ApiLogsDashboardDto['server'] {
    return this.apiLogsService.getServerStatus();
  }
}
