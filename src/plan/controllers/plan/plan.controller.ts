import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Plan } from '@prisma/client';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CreatePlanDto, UpdatePlanDto } from 'src/plan/dtos/plan.dto';
import type {
  IPlanController,
  IPlanService,
} from 'src/plan/interfaces/plan.interface';
import { ROUTES, SERVICES } from 'src/utils/constants';

@Controller(ROUTES.PLAN)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
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

  @Post()
  @ApiOperation({ summary: 'Créer un plan' })
  @ApiBody({ type: CreatePlanDto })
  @ApiOkResponse({ description: 'Plan créé' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  createPlan(@Body() plan: CreatePlanDto): Promise<Plan> {
    return this.planService.createPlan(plan);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un plan' })
  @ApiBody({ type: UpdatePlanDto })
  @ApiOkResponse({ description: 'Plan mis à jour' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  updatePlan(@Param('id') id: string, @Body() plan: UpdatePlanDto): Promise<Plan> {
    return this.planService.updatePlan(id, plan);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un plan' })
  @ApiOkResponse({ description: 'Plan supprimé' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  deletePlan(@Param('id') id: string): Promise<Plan> {
    return this.planService.deletePlan(id);
  }
}
