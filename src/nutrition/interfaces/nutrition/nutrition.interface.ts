import { Nutrition } from '@prisma/client';
import type { UpdateNutritionDto } from 'src/nutrition/dtos/update-nutrition.dto';

export interface INutritionController {
  getNutritions(): Promise<Nutrition[]>;
  getNutritionById(id: string): Promise<Nutrition>;
  updateNutrition(
    id: string,
    nutrition: UpdateNutritionDto,
  ): Promise<Nutrition>;
  deleteNutrition(id: string): Promise<Nutrition>;
  triggerImport(): Promise<{ message: string; count: number }>;
}

export interface INutritionService {
  getNutritions(): Promise<Nutrition[]>;
  getNutritionById(id: string): Promise<Nutrition>;
  updateNutrition(
    id: string,
    nutrition: UpdateNutritionDto,
  ): Promise<Nutrition>;
  deleteNutrition(id: string): Promise<Nutrition>;
  runImportPipeline(): Promise<number>;
}
