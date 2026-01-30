/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Inject,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiQuery,
} from '@nestjs/swagger';
import type {
  IWorkout_SessionService,
  IWorkout_SessionController,
} from 'src/workout-session/interfaces/workout-session/workout-session.interface';
import { SERVICES } from 'src/utils/constants';

@Controller('workout-session')
@ApiTags('Workout Sessions & Dashboard')
export class Workout_SessionController implements IWorkout_SessionController {
  constructor(
    @Inject(SERVICES.WORKOUT_SESSION)
    private readonly workoutSessionService: IWorkout_SessionService,
  ) {}

  @Get('dashboard/:userId')
  @ApiOperation({
    summary:
      'Récupérer les indicateurs clés (KPIs) pour le dashboard utilisateur',
  })
  @ApiOkResponse({
    description: 'Retourne le total des calories, heures et sessions',
  })
  async getDashboard(@Param('userId', ParseIntPipe) userId: number) {
    return await this.workoutSessionService.getUserSummary(userId);
  }

  @Get('level/:userId')
  @ApiOperation({
    summary: "Récupérer le rang et la progression de l'utilisateur",
  })
  @ApiOkResponse({
    description:
      'Retourne le niveau (Légende, Athlète, etc.) basé sur les calories',
  })
  async getLevel(@Param('userId', ParseIntPipe) userId: number) {
    return await this.workoutSessionService.getUserLevel(userId);
  }

  @Get('stats/intensity/:userId')
  @ApiOperation({
    summary: "Obtenir les moyennes d'intensité d'un utilisateur spécifique",
  })
  @ApiOkResponse({
    description: 'Retourne les moyennes de BPM et calories par session',
  })
  async getIntensity(@Param('userId', ParseIntPipe) userId: number) {
    return await this.workoutSessionService.getIntensityStats(userId);
  }

  @Get('history/:userId')
  @ApiOperation({
    summary:
      "Récupérer l'historique avec filtre optionnel par date (journalier ou mensuel)",
  })
  @ApiQuery({
    name: 'date',
    required: false,
    example: '2026-01-30',
    description: 'Format YYYY-MM-DD ou YYYY-MM',
  })
  async getHistory(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('date') date?: string,
  ) {
    return await this.workoutSessionService.getWorkoutSessions(userId, date);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une séance spécifique par son ID' })
  @ApiOkResponse({
    description: "Détails de la séance avec ses logs d'exercices",
  })
  @ApiNotFoundResponse({ description: 'Séance introuvable' })
  async getSessionById(@Param('id', ParseIntPipe) id: number) {
    return await this.workoutSessionService.getWorkoutSessionById(id);
  }
}
