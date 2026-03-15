import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ROUTES } from 'src/utils/constants';
import { DashboardService } from './dashboard.service';
import { DashboardPilotageDto } from './dtos/dashboard-pilotage.dto';

@Controller(ROUTES.DASHBOARD)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiTags(ROUTES.DASHBOARD)
@ApiBearerAuth('access-token')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('pilotage')
  @ApiOperation({
    summary: 'Données de pilotage du dashboard (KPIs, qualité, tendance, alertes)',
  })
  @ApiOkResponse({
    description: 'KPIs, tendance qualité 7j, répartition âge, objectifs, alertes (source BDD)',
  })
  async getPilotage(): Promise<DashboardPilotageDto> {
    return this.dashboardService.getPilotage();
  }
}
