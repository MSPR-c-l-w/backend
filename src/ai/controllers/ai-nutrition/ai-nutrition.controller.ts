import { Controller, Inject, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import type { JwtPayload } from 'src/auth/strategies/jwt.strategy';
import {
  AiNutritionService,
  MealPlanResult,
} from 'src/ai/services/ai-nutrition/ai-nutrition.service';
import { SERVICES } from 'src/utils/constants';

@ApiBearerAuth('access-token')
@ApiTags('ai')
@Controller('ai/nutrition')
export class AiNutritionController {
  constructor(
    @Inject(SERVICES.AI_NUTRITION)
    private readonly aiNutritionService: AiNutritionService,
  ) {}

  @Post('meal-plan')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Générer un plan repas personnalisé via le micro-service IA',
    description:
      "Récupère les biométriques du user connecté (HealthProfile) et les envoie à l'api-ia. Le résultat est persisté en MongoDB (nutrition_recommendations) et en SQL (AiNutritionRecommendation).",
  })
  @ApiUnauthorizedResponse({ description: 'JWT invalide ou expiré' })
  generate(@Req() req: Request): Promise<MealPlanResult> {
    const payload = req.user as JwtPayload;
    return this.aiNutritionService.generateMealPlanForUser(payload.sub);
  }
}
