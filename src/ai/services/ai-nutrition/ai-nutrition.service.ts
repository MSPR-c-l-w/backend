import { Injectable, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { isAxiosError } from 'axios';
import { Prisma } from '@prisma/client';
import { lastValueFrom } from 'rxjs';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { MetricsService } from 'src/metrics/metrics.service';
import { StorageService } from 'src/media/services/storage/storage.service';
import { WorkoutMicroserviceUnavailableException } from 'src/ai/exceptions/workout-microservice.exception';
import type { FoodAnalysisResult } from 'src/ai/interfaces/food-analysis.interface';

export interface MealPlanDay {
  day: number;
  breakfast: string;
  lunch: string;
  dinner: string;
  snack: string | null;
  estimatedCalories: number;
}

export interface MealPlanResult {
  userGoal: string;
  days: MealPlanDay[];
  notes: string[];
  modelStatus: string;
}

const REQUEST_TIMEOUT_MS = 15_000;
const ANALYSIS_TIMEOUT_MS = 30_000;

@Injectable()
export class AiNutritionService {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly metricsService: MetricsService,
    private readonly storageService: StorageService,
  ) {
    this.baseUrl = (process.env.WORKOUT_SERVICE_URL ?? '').replace(/\/$/, '');
    this.apiKey = process.env.WORKOUT_SERVICE_API_KEY ?? '';
  }

  async generateMealPlanForUser(userId: number): Promise<MealPlanResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, is_deleted: false },
      include: { healthProfile: true },
    });

    if (!user) throw new NotFoundException('USER_NOT_FOUND');

    const age = user.date_of_birth
      ? Math.floor(
          (Date.now() - new Date(user.date_of_birth).getTime()) /
            (1000 * 60 * 60 * 24 * 365.25),
        )
      : null;

    const body = {
      userId,
      userGoal: 'equilibre',
      weightKg: user.healthProfile?.weight ?? null,
      heightCm: user.height ?? null,
      ageYears: age,
      gender: user.gender ?? null,
      physicalActivityLevel:
        user.healthProfile?.physical_activity_level ?? null,
      dailyCaloriesTarget: user.healthProfile?.daily_calories_target ?? null,
    };

    try {
      const response = await lastValueFrom(
        this.httpService.post<MealPlanResult>(
          `${this.baseUrl}/ai/nutrition/meal-plan`,
          body,
          {
            headers: {
              'X-API-Key': this.apiKey,
              'Content-Type': 'application/json',
            },
            timeout: REQUEST_TIMEOUT_MS,
          },
        ),
      );

      await this.prisma.aiNutritionRecommendation.create({
        data: {
          user_id: userId,
          type: 'MEAL_PLAN',
          meal_plan: response.data as unknown as Prisma.InputJsonValue,
        },
      });

      this.metricsService.enregistrerAppelIA(
        'nutrition-microservice',
        'generate-meal-plan',
      );

      return response.data;
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        throw new Error(
          `Micro-service nutrition indisponible: ${error.message}`,
        );
      }
      throw error;
    }
  }

  async analyzePhotoForUser(
    userId: number,
    file: Express.Multer.File,
  ): Promise<FoodAnalysisResult> {
    const uploaded = await this.storageService.upload(
      file.buffer,

      file.mimetype,

      file.originalname,
      'image',
    );

    let analysisResult: FoodAnalysisResult;
    try {
      const response = await lastValueFrom(
        this.httpService.post<FoodAnalysisResult>(
          `${this.baseUrl}/ai/nutrition/analyze-photo`,
          { imageUrl: uploaded.url, userId },
          {
            headers: {
              'X-API-Key': this.apiKey,
              'Content-Type': 'application/json',
            },
            timeout: ANALYSIS_TIMEOUT_MS,
          },
        ),
      );
      analysisResult = response.data;
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        throw new WorkoutMicroserviceUnavailableException(
          `Micro-service analyse photo indisponible: ${error.message}`,
        );
      }
      throw error;
    }

    await this.prisma.aiNutritionRecommendation.create({
      data: {
        user_id: userId,
        type: 'ANALYSIS',
        input_image_url: uploaded.url,
        aliments_detectes:
          analysisResult.alimentsDetectes as unknown as Prisma.InputJsonValue,
        macros: analysisResult.macros as unknown as Prisma.InputJsonValue,
        suggestions: analysisResult.suggestions,
      },
    });

    this.metricsService.enregistrerAppelIA(
      'nutrition-microservice',
      'analyze-photo',
    );

    return { ...analysisResult, imageUrl: uploaded.url };
  }
}
