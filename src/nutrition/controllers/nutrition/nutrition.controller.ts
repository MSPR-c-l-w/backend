import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Nutrition } from '@prisma/client';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UpdateNutritionDto } from 'src/nutrition/dtos/update-nutrition.dto';
import type {
  INutritionController,
  INutritionService,
} from 'src/nutrition/interfaces/nutrition/nutrition.interface';
import { ROUTES, SERVICES } from 'src/utils/constants';

@Controller(ROUTES.NUTRITION)
@UseGuards(JwtAuthGuard)
@ApiTags('Gestion Nutrition')
@ApiBearerAuth('access-token')
export class NutritionController implements INutritionController {
  constructor(
    @Inject(SERVICES.NUTRITION)
    private readonly nutritionService: INutritionService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer les nutriments avec pagination' })
  @ApiOkResponse({ description: 'Liste des nutriments paginée' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Numéro de page (défaut: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: "Nombre d'éléments par page (défaut: 20)",
  })
  async getNutritions(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
  ): Promise<{ data: Nutrition[]; total: number }> {
    return this.nutritionService.getNutritions(page, limit);
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

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un nutriment' })
  @ApiBody({ type: UpdateNutritionDto })
  @ApiOkResponse({ description: 'Nutriment mis à jour' })
  @ApiParam({ name: 'id', description: 'ID du nutriment' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  updateNutrition(
    @Param('id') id: string,
    @Body() nutrition: UpdateNutritionDto,
  ): Promise<Nutrition> {
    return this.nutritionService.updateNutrition(id, nutrition);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un nutriment' })
  @ApiOkResponse({ description: 'Nutriment supprimé' })
  @ApiParam({ name: 'id', description: 'ID du nutriment' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  deleteNutrition(@Param('id') id: string): Promise<Nutrition> {
    return this.nutritionService.deleteNutrition(id);
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
