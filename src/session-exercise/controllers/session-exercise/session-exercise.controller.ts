import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  Inject,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { JwtPayload } from 'src/auth/strategies/jwt.strategy';
import type {
  ISessionExerciseController,
  ISessionExerciseService,
} from 'src/session-exercise/interfaces/session-exercise/session-exercise.interface';
import { ROUTES, SERVICES } from 'src/utils/constants';

@Controller(ROUTES.SESSION_EXERCISE)
@ApiTags(ROUTES.SESSION_EXERCISE)
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
export class SessionExerciseController implements ISessionExerciseController {
  constructor(
    @Inject(SERVICES.SESSION_EXERCISE)
    private readonly sessionExerciseService: ISessionExerciseService,
  ) {}

  @Post('import')
  @ApiOperation({
    summary:
      'Déclencher la pipeline ETL pour importer les données Kaggle (Sessions + Session Exercises)',
  })
  @ApiOkResponse({ description: 'Importation réussie' })
  @ApiInternalServerErrorResponse({
    description: 'Erreur lors du traitement du fichier CSV',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async triggerImport(): Promise<{ message: string; count: number }> {
    const count = await this.sessionExerciseService.runLogsImportPipeline();
    return {
      message: 'Le pipeline ETL Kaggle a été exécuté avec succès.',
      count: count,
    };
  }

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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'COACH')
  async getTopExercises(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<any[]> {
    return await this.sessionExerciseService.getTopExercises(userId);
  }

  @Get('stats/top-exercises')
  @ApiOperation({
    summary: 'Obtenir mes 5 exercices les plus pratiqués',
  })
  async getMyTopExercises(@Req() req: Request): Promise<any[]> {
    const payload = req.user as JwtPayload;
    return await this.sessionExerciseService.getTopExercises(payload.sub);
  }

  @Get()
  @ApiOperation({
    summary:
      "Récupérer l'intégralité des sessions exercises (détails techniques)",
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'COACH')
  async getSessionExercises(): Promise<any[]> {
    return await this.sessionExerciseService.getSessionExercises();
  }

  @Get(':sessionId/:exerciseId')
  @ApiOperation({
    summary:
      'Récupérer une de mes session exercise via (session_id, exercise_id)',
  })
  @ApiOkResponse({
    description:
      "Détails de la session exercise (si elle appartient à l'utilisateur connecté)",
  })
  @ApiNotFoundResponse({
    description: 'Session exercise introuvable ou ne vous appartient pas',
  })
  async getSessionExerciseById(
    @Req() req: Request,
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Param('exerciseId', ParseIntPipe) exerciseId: number,
  ): Promise<any> {
    const payload = req.user as JwtPayload;
    return await this.sessionExerciseService.getSessionExerciseById(
      sessionId,
      exerciseId,
      payload.sub,
    );
  }
}
