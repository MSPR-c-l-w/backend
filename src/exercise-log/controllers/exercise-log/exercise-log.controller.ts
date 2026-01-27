import { Controller, Get, Inject, Param, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Exercise_Log } from 'src/utils/types';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import type { IExercise_LogController, IExercise_LogService } from 'src/exercise-log/interfaces/exercise-log/exercise-log.interface';
import { ROUTES, SERVICES } from 'src/utils/constants';

@Controller(ROUTES.EXERCISE_LOG)
@UseGuards(JwtAuthGuard)
@ApiTags(ROUTES.EXERCISE_LOG)
export class Exercise_LogController implements IExercise_LogController {
  constructor(@Inject(SERVICES.EXERCISE_LOG) private readonly exerciseLogService: IExercise_LogService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les exercices' })
  @ApiOkResponse({ description: 'Liste des exercices' })
  async getExerciseLogs(): Promise<Exercise_Log[]> {
    return this.exerciseLogService.getExerciseLogs();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un exercice par id' })
  @ApiOkResponse({ description: 'Exercice' })
  @ApiParam({ name: 'id', description: 'ID de l\'exercice' })
  @ApiNotFoundResponse({ description: 'Exercice non trouvé' })
  @ApiBadRequestResponse({ description: 'ID de l\'exercice invalide' })
  async getExerciseLogById(@Param('id') id: string): Promise<Exercise_Log> {
    return this.exerciseLogService.getExerciseLogById(id);
  }
}
