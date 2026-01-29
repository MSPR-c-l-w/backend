import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  Inject,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import type {
  IExercise_LogController,
  IExercise_LogService,
} from 'src/exercise-log/interfaces/exercise-log/exercise-log.interface';
import { ROUTES, SERVICES } from 'src/utils/constants';

@Controller(ROUTES.EXERCISE_LOG)
@ApiTags('Exercise Logs (Technical & ETL)')
export class Exercise_LogController implements IExercise_LogController {
  constructor(
    @Inject(SERVICES.EXERCISE_LOG)
    private readonly exerciseLogService: IExercise_LogService,
  ) {}

  // --- ACTIONS (PIPELINE) ---

  @Post('import')
  @ApiOperation({
    summary:
      'Déclencher la pipeline ETL pour importer les données Kaggle (Sessions + Logs)',
  })
  @ApiOkResponse({ description: 'Importation réussie' })
  @ApiInternalServerErrorResponse({
    description: 'Erreur lors du traitement du fichier CSV',
  })
  async triggerImport(): Promise<{ message: string; count: number }> {
    const count = await this.exerciseLogService.runLogsImportPipeline();
    return {
      message: 'Le pipeline ETL Kaggle a été exécuté avec succès.',
      count: count,
    };
  }

  // --- STATISTIQUES DES EXERCICES ---

  @Get('stats/top-exercises-global')
  @ApiOperation({
    summary:
      'Obtenir les 5 exercices les plus populaires (tous utilisateurs confondus)',
  })
  async getGlobalTopExercises(): Promise<any[]> {
    return await this.exerciseLogService.getGlobalTopExercises();
  }

  @Get('stats/top-exercises/:userId')
  @ApiOperation({
    summary:
      'Obtenir les 5 exercices les plus pratiqués par un utilisateur spécifique',
  })
  async getTopExercises(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<any[]> {
    return await this.exerciseLogService.getTopExercises(userId);
  }

  // --- LECTURE TECHNIQUE ---

  @Get()
  @ApiOperation({
    summary:
      "Récupérer l'intégralité des logs d'exercices (détails techniques)",
  })
  async getExerciseLogs(): Promise<any[]> {
    return await this.exerciseLogService.getExerciseLogs();
  }

  @Get(':id')
  @ApiOperation({
    summary: "Récupérer un log d'exercice spécifique par son ID",
  })
  @ApiNotFoundResponse({ description: 'Log introuvable' })
  async getExerciseLogById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<any> {
    return await this.exerciseLogService.getExerciseLogById(id);
  }
}
