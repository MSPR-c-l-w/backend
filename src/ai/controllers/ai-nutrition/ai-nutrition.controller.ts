import {
  BadRequestException,
  Controller,
  Inject,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import type { JwtPayload } from 'src/auth/strategies/jwt.strategy';
import {
  AiNutritionService,
  MealPlanResult,
} from 'src/ai/services/ai-nutrition/ai-nutrition.service';
import type { FoodAnalysisResult } from 'src/ai/interfaces/food-analysis.interface';
import { SERVICES } from 'src/utils/constants';

const ONE_MB = 1024 * 1024;
const ALLOWED_PHOTO_MIMES = new Set(['image/jpeg', 'image/png']);

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

  @Post('analyze-photo')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('photo', {
      limits: { fileSize: 10 * ONE_MB },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        photo: { type: 'string', format: 'binary' },
      },
      required: ['photo'],
    },
  })
  @ApiOperation({
    summary: "Analyser une photo d'aliment via le micro-service IA",
    description:
      "Upload une photo JPEG/PNG d'un repas. La photo est stockée sur S3, puis transmise au micro-service IA pour détection des aliments, estimation des macros et génération de recommandations nutrition/sport. Le résultat est persisté dans AiNutritionRecommendation avec type=ANALYSIS.",
  })
  @ApiUnauthorizedResponse({ description: 'JWT invalide ou expiré' })
  @ApiServiceUnavailableResponse({
    description: "Micro-service d'analyse photo indisponible",
  })
  analyzePhoto(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<FoodAnalysisResult> {
    if (!file) {
      throw new BadRequestException('PHOTO_REQUIRED');
    }

    if (!ALLOWED_PHOTO_MIMES.has(file.mimetype)) {
      throw new BadRequestException('UNSUPPORTED_PHOTO_TYPE_JPEG_OR_PNG_ONLY');
    }
    const payload = req.user as JwtPayload;
    return this.aiNutritionService.analyzePhotoForUser(payload.sub, file);
  }
}
