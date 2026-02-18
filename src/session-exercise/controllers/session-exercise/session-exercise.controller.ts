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
  ISessionExerciseController,
  ISessionExerciseService,
} from 'src/session-exercise/interfaces/session-exercise/session-exercise.interface';
import { ROUTES, SERVICES } from 'src/utils/constants';

@Controller(ROUTES.SESSION_EXERCISE)
@ApiTags('Session Exercises (Technical & ETL)')
export class SessionExerciseController implements ISessionExerciseController {
  constructor(
    @Inject(SERVICES.SESSION_EXERCISE)
    private readonly sessionExerciseService: ISessionExerciseService,
  ) {}

  // --- ACTIONS (PIPELINE) ---

  @Post('import')
  @ApiOperation({
    summary:
      'Déclencher la pipeline ETL pour importer les données Kaggle (Sessions + Session Exercises)',
  })
  @ApiOkResponse({ description: 'Importation réussie' })
  @ApiInternalServerErrorResponse({
    description: 'Erreur lors du traitement du fichier CSV',
  })
  async triggerImport(): Promise<{ message: string; count: number }> {
    const count = await this.sessionExerciseService.runLogsImportPipeline();
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
    return await this.sessionExerciseService.getGlobalTopExercises();
  }

  @Get('stats/top-exercises/:userId')
  @ApiOperation({
    summary:
      'Obtenir les 5 exercices les plus pratiqués par un utilisateur spécifique',
  })
  async getTopExercises(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<any[]> {
    return await this.sessionExerciseService.getTopExercises(userId);
  }

  // --- LECTURE TECHNIQUE ---

  @Get()
  @ApiOperation({
    summary:
      "Récupérer l'intégralité des session exercises (détails techniques)",
  })
  async getSessionExercises(): Promise<any[]> {
    return await this.sessionExerciseService.getSessionExercises();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Récupérer un session exercise spécifique (filtré par session_id)',
  })
  @ApiNotFoundResponse({ description: 'Session exercise introuvable' })
  async getSessionExerciseById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<any> {
    return await this.sessionExerciseService.getSessionExerciseById(id);
  }
}
