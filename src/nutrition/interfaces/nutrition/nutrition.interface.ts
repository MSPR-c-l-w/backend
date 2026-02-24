import { Nutrition } from '@prisma/client';

export interface INutritionController {
  getNutritions(): Promise<Nutrition[]>;
  getNutritionById(id: string): Promise<Nutrition>;
  triggerImport(): Promise<{ message: string; count: number }>;
}

export interface INutritionService {
  getNutritions(): Promise<Nutrition[]>;
  getNutritionById(id: string): Promise<Nutrition>;
  runImportPipeline(): Promise<number>;
}
