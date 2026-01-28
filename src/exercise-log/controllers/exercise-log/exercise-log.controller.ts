import { Controller, Get, Post, Param, ParseIntPipe, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiNotFoundResponse, ApiInternalServerErrorResponse } from '@nestjs/swagger';
import { ExerciseLog } from '@prisma/client';
import type { IExercise_LogController, IExercise_LogService } from 'src/exercise-log/interfaces/exercise-log/exercise-log.interface';
import { ROUTES, SERVICES } from 'src/utils/constants';

@Controller(ROUTES.EXERCISE_LOG)
@ApiTags('Exercise Logs & Fitness Stats')
export class Exercise_LogController implements IExercise_LogController {
  constructor(
    @Inject(SERVICES.EXERCISE_LOG) private readonly exerciseLogService: IExercise_LogService
  ) {}

  @Post('import')
  @ApiOperation({ summary: 'Déclencher la pipeline ETL pour importer les données biométriques Kaggle' })
  @ApiOkResponse({ description: 'Importation réussie' })
  @ApiInternalServerErrorResponse({ description: 'Erreur lors du traitement du fichier CSV' })
  async triggerImport(): Promise<{ message: string; count: number }> {
    const count = await this.exerciseLogService.runLogsImportPipeline();
    return {
      message: "Le pipeline ETL Kaggle a été exécuté avec succès.",
      count: count
    };
  }

  // --- DASHBOARD & GAMIFICATION ---

  @Get('dashboard/:userId')
  @ApiOperation({ summary: 'Récupérer les indicateurs clés (KPIs) pour le dashboard utilisateur' })
  async getDashboard(@Param('userId', ParseIntPipe) userId: number): Promise<any> {
    return await this.exerciseLogService.getUserSummary(userId);
  }

  @Get('level/:userId')
  @ApiOperation({ summary: 'Récupérer le rang et la progression de l\'utilisateur' })
  async getLevel(@Param('userId', ParseIntPipe) userId: number): Promise<any> {
    return await this.exerciseLogService.getUserLevel(userId);
  }

  // --- STATISTIQUES (SÉPARÉES) ---

  @Get('stats/top-exercises-global')
  @ApiOperation({ summary: 'Obtenir les 5 exercices les plus populaires de toute l\'application' })
  async getGlobalTopExercises(): Promise<any[]> {
    return await this.exerciseLogService.getGlobalTopExercises();
  }

  @Get('stats/top-exercises/:userId')
  @ApiOperation({ summary: 'Obtenir les 5 exercices les plus pratiqués par un utilisateur spécifique' })
  async getTopExercises(@Param('userId', ParseIntPipe) userId: number): Promise<any[]> {
    return await this.exerciseLogService.getTopExercises(userId);
  }

  @Get('stats/intensity-metrics/:userId')
  @ApiOperation({ summary: 'Obtenir les moyennes d\'intensité d\'un utilisateur spécifique' })
  async getIntensity(@Param('userId', ParseIntPipe) userId: number): Promise<any> {
    return await this.exerciseLogService.getIntensityStats(userId);
  }

  // --- LECTURE ---

  @Get()
  @ApiOperation({ summary: 'Récupérer l\'intégralité des logs d\'exercices' })
  async getExerciseLogs(): Promise<ExerciseLog[]> {
    return await this.exerciseLogService.getExerciseLogs();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un log spécifique par son ID' })
  @ApiNotFoundResponse({ description: 'Log introuvable' })
  async getExerciseLogById(@Param('id', ParseIntPipe) id: number): Promise<ExerciseLog> {
    return await this.exerciseLogService.getExerciseLogById(id);
  }
}