import { Controller, Get, Inject, Param, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ExerciseLog } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import type { IExerciseLogController, IExerciseLogService } from 'src/exercise-log/interfaces/exercise-log/exercise-log.interface';
import { ROUTES, SERVICES } from 'src/utils/constants';

@Controller(ROUTES.EXERCISELOG)
@UseGuards(JwtAuthGuard)
@ApiTags(ROUTES.EXERCISELOG)
export class ExerciseLogController implements IExerciseLogController {
  constructor(@Inject(SERVICES.EXERCISELOG) private readonly exerciseLogService: IExerciseLogService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les exercices' })
  @ApiOkResponse({ description: 'Liste des exercices' })
  async getExerciseLogs(): Promise<ExerciseLog[]> {
    return this.exerciseLogService.getExerciseLogs();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un exercice par id' })
  @ApiOkResponse({ description: 'Exercice' })
  @ApiParam({ name: 'id', description: 'ID de l\'exercice' })
  @ApiNotFoundResponse({ description: 'Exercice non trouvé' })
  @ApiBadRequestResponse({ description: 'ID de l\'exercice invalide' })
  async getExerciseLogById(@Param('id') id: string): Promise<ExerciseLog> {
    return this.exerciseLogService.getExerciseLogById(id);
  }
}
