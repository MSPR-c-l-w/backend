import {
  Controller,
  Get,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Nutrition } from '@prisma/client';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import type {
  INutritionController,
  INutritionService,
} from 'src/nutrition/interfaces/nutrition/nutrition.interface';
import { ROUTES, SERVICES } from 'src/utils/constants';

@Controller(ROUTES.NUTRITION)
@UseGuards(JwtAuthGuard)
@ApiTags(ROUTES.NUTRITION)
@ApiBearerAuth('access-token')
export class NutritionController implements INutritionController {
  constructor(
    @Inject(SERVICES.NUTRITION)
    private readonly nutritionService: INutritionService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer tout les nutriments' })
  @ApiOkResponse({ description: 'Liste des nutriments' })
  async getNutritions(): Promise<Nutrition[]> {
    return this.nutritionService.getNutritions();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un nutriment par id' })
  @ApiOkResponse({ description: 'Nutriment' })
  @ApiParam({ name: 'id', description: 'ID du nutriment' })
  @ApiNotFoundResponse({ description: 'Nutriment non trouvé' })
  @ApiBadRequestResponse({ description: 'ID du nutriment invalide' })
  async getNutritionById(@Param('id') id: string): Promise<Nutrition> {
    return this.nutritionService.getNutritionById(id);
  }

  @Post('import')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({
    summary:
      'Lancer manuellement la collecte et transformation des données (ETL)',
  })
  @ApiOkResponse({ description: 'Collecte et synchronisation réussies' })
  @ApiInternalServerErrorResponse({
    description: 'Erreur lors du pipeline ETL',
  })
  async triggerImport(): Promise<{ message: string; count: number }> {
    const count = await this.nutritionService.runImportPipeline();

    return {
      message: 'Le pipeline ETL a été exécuté avec succès.',
      count,
    };
  }
}
