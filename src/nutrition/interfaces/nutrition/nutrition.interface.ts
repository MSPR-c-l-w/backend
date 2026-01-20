import { Nutrition } from "@prisma/client";

export interface INutritionController {
    getNutritions(): Promise<Nutrition[]>;
    getNutritionById(id: string): Promise<Nutrition>;
}

export interface INutritionService {
    getNutritions(): Promise<Nutrition[]>;
    getNutritionById(id: string): Promise<Nutrition>;
}
 