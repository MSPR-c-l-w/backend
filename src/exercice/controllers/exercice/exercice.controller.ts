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
  ApiBearerAuth,
  ApiBadGatewayResponse,
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Exercise } from '@prisma/client';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UpdateExerciceDto } from 'src/exercice/dtos/update-exercice.dto';
import { ExerciceService } from 'src/exercice/services/exercice/exercice.service';
import type { IExerciceController } from 'src/exercice/interfaces/exercice/exercice.interface';
import { ROUTES, SERVICES } from 'src/utils/constants';

@Controller(ROUTES.EXERCISE)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiTags(ROUTES.EXERCISE)
export class ExerciceController implements IExerciceController {
  constructor(
    @Inject(SERVICES.EXERCISE)
    private readonly exerciceService: ExerciceService,
  ) {}

  @Post('import')
  @ApiOperation({
    summary:
      'Lancer manuellement la collecte et transformation des données (ETL)',
  })
  @ApiOkResponse({ description: 'Collecte et synchronisation réussies' })
  @ApiInternalServerErrorResponse({
    description: 'Erreur lors du pipeline ETL',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async triggerImport(): Promise<{ message: string; count: number }> {
    const count = await this.exerciceService.runImportPipeline();

    return {
      message: 'Le pipeline ETL a été exécuté avec succès.',
      count: count,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les exercices avec pagination' })
  @ApiOkResponse({ description: 'Liste des exercices paginée' })
  async getExercices(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
  ): Promise<Exercise[]> {
    return this.exerciceService.getExercices(page, limit);
  }

  @Get('search')
  @ApiOperation({ summary: 'Rechercher des exercices par filtres' })
  @ApiOkResponse({ description: 'Résultats de la recherche' })
  @ApiQuery({
    name: 'muscle',
    required: false,
    description: 'Ex: pectoraux, biceps...',
  })
  @ApiQuery({
    name: 'level',
    required: false,
    description: 'Ex: débutant, expert...',
  })
  @ApiQuery({
    name: 'equipment',
    required: false,
    description: 'Ex: haltères, barre...',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Ex: force, cardio...',
  })
  async search(
    @Query('muscle') muscle?: string,
    @Query('level') level?: string,
    @Query('equipment') equipment?: string,
    @Query('category') category?: string,
  ): Promise<Exercise[]> {
    return await this.exerciceService.findByFilters({
      muscle,
      level,
      equipment,
      category,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un exercice par son ID' })
  @ApiOkResponse({ description: 'Exercice trouvé' })
  @ApiParam({ name: 'id', description: "ID de l'exercice" })
  @ApiNotFoundResponse({ description: 'Exercice non trouvé' })
  @ApiBadGatewayResponse({ description: "Id de l'exercice invalide" })
  async getExerciceById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Exercise> {
    return await this.exerciceService.getExerciceById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un exercice' })
  @ApiBody({ type: UpdateExerciceDto })
  @ApiOkResponse({ description: 'Exercice mis à jour' })
  @ApiParam({ name: 'id', description: "ID de l'exercice" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  updateExercice(
    @Param('id', ParseIntPipe) id: number,
    @Body() exercice: UpdateExerciceDto,
  ): Promise<Exercise> {
    return this.exerciceService.updateExercice(id, exercice);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un exercice' })
  @ApiOkResponse({ description: 'Exercice supprimé' })
  @ApiParam({ name: 'id', description: "ID de l'exercice" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  deleteExercice(@Param('id', ParseIntPipe) id: number): Promise<Exercise> {
    return this.exerciceService.deleteExercice(id);
  }
}
