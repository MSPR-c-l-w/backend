import { Controller, Inject, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import type { JwtPayload } from 'src/auth/strategies/jwt.strategy';
import type { GenerateWorkoutResult } from 'src/ai/services/ai-workout/ai-workout.service';
import { AiWorkoutService } from 'src/ai/services/ai-workout/ai-workout.service';
import { SERVICES } from 'src/utils/constants';

@ApiBearerAuth('access-token')
@ApiTags('ai')
@Controller('ai/workout')
export class AiWorkoutController {
  constructor(
    @Inject(SERVICES.AI_WORKOUT)
    private readonly aiWorkoutService: AiWorkoutService,
  ) {}

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: "Générer un programme d'entraînement via le micro-service IA",
  })
  @ApiUnauthorizedResponse({ description: 'JWT invalide ou expiré' })
  @ApiServiceUnavailableResponse({
    description: 'Micro-service workout indisponible ou non configuré',
  })
  generate(@Req() req: Request): Promise<GenerateWorkoutResult> {
    const payload = req.user as JwtPayload;
    return this.aiWorkoutService.generateForUser(payload.sub);
  }
}
