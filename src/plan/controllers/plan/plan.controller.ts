import { Controller, Get, Inject, Param, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Plan } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import type {
  IPlanController,
  IPlanService,
} from 'src/plan/interfaces/plan.interface';
import { ROUTES, SERVICES } from 'src/utils/constants';

@Controller(ROUTES.PLAN)
@UseGuards(JwtAuthGuard)
@ApiTags(ROUTES.PLAN)
export class PlanController implements IPlanController {
  constructor(
    @Inject(SERVICES.PLAN) private readonly planService: IPlanService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les plans' })
  @ApiOkResponse({ description: 'Liste des plans' })
  async getPlans(): Promise<Plan[]> {
    return this.planService.getPlans();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un plan par id' })
  @ApiOkResponse({ description: 'Plan' })
  @ApiParam({ name: 'id', description: 'ID du plan' })
  @ApiNotFoundResponse({ description: 'Plan non trouvé' })
  @ApiBadRequestResponse({ description: 'ID du plan invalide' })
  async getPlanById(@Param('id') id: string): Promise<Plan> {
    return this.planService.getPlanById(id);
  }
}
