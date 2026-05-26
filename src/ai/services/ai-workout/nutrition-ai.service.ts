import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Nutrition } from '@prisma/client';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { EtlAnomalyDetectorService } from 'src/etl/services/etl-anomaly-detector/etl-anomaly-detector.service';
import { SERVICES } from 'src/utils/constants';

interface DetectedFood {
  name: string;
  confidence: number;
}

interface VisionServiceResponse {
  detectedFoods: DetectedFood[];
}

interface MacroNutrients {
  calories_kcal: number;
  protein_g: number;
  carbohydrates_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  cholesterol_mg: number;
}

interface AnalysisResult {
  alimentsDetectes: DetectedFood[];
  macros: MacroNutrients;
  suggestions: string[];
  anomalies: Record<string, unknown>[];
}

interface BalanceAnalysis {
  isBalanced: boolean;
  anomalies: Record<string, unknown>[];
  suggestions?: string[];
}

interface FallbackNutrition {
  name: string;
  category: string;
  calories_kcal: number;
  protein_g: number;
  carbohydrates_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  cholesterol_mg: number;
  meal_type_name: string;
  water_intake_ml: number;
  picture_url: null;
}

interface UserProfile {
  age?: number;
  gender?: string;
  daily_calories_target?: number;
  physical_activity_level?: string;
}

@Injectable()
export class NutritionAiService {
  private readonly logger = new Logger(NutritionAiService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(SERVICES.HUGGINGFACE_VISION_SERVICE)
    private readonly huggingFaceService: { identifyFoodFromImage: (url: string) => Promise<VisionServiceResponse> },
    @Inject(SERVICES.GOOGLE_VISION_SERVICE)
    private readonly googleVisionService: { analyzeFoodImage: (url: string) => Promise<VisionServiceResponse> },
    private readonly anomalyDetector: EtlAnomalyDetectorService,
  ) {}

  /**
   * Identifie les aliments à partir d'une image et génère une analyse nutritionnelle
   * @param imageUrl URL de l'image à analyser
   * @param userId ID de l'utilisateur
   * @returns Analyse complète avec aliments détectés, macros et suggestions
   */
  async identifyNutritionFromImage(
    imageUrl: string,
    userId: number,
  ): Promise<AnalysisResult> {
    this.logger.log(
      `Identification nutrition pour utilisateur ${userId}: ${imageUrl}`,
    );

    // Étape 1: Identifier aliments via vision AI
    let detectedFoods: DetectedFood[] = [];
    try {
      const result = await this.huggingFaceService.identifyFoodFromImage(
        imageUrl,
      );
      detectedFoods = result.detectedFoods || [];
    } catch (hfError) {
      this.logger.warn(
        `HuggingFace indisponible, fallback Google Vision: ${(hfError as Error).message}`,
      );

      try {
        const result = await this.googleVisionService.analyzeFoodImage(
          imageUrl,
        );
        detectedFoods = result.detectedFoods || [];
      } catch (googleError) {
        this.logger.error(
          `Tous les services de vision ont échoué: HF=${(hfError as Error).message}, Google=${(googleError as Error).message}`,
        );
        throw new ServiceUnavailableException(
          'Impossible de traiter l\'image : tous les services de vision sont indisponibles.',
        );
      }
    }

    // Étape 2: Réconcilier avec la base de données Nutrition
    const foodNames = detectedFoods.map((f) => f.name);
    const nutritionItems = await this.reconcileWithDatabase(foodNames);

    // Étape 3: Calculer macros agrégées
    const macros = this.computeAggregatedMacros(nutritionItems);

    // Étape 4: Détecter anomalies
    const anomalies = this.anomalyDetector.detectForPipeline('nutrition', {
      ...macros,
      alimentsDetectes: detectedFoods,
    });

    // Étape 5: Générer suggestions
    const userProfile = await this.getUserProfile(userId);
    const suggestionResult = await this.generateNutritionSuggestions(
      macros,
      userProfile,
    );

    // Étape 6: Persister recommandation
    await this.prisma.aiNutritionRecommendation.create({
      data: {
        user_id: userId,
        type: 'ANALYSIS',
        input_image_url: imageUrl,
        aliments_detectes: detectedFoods,
        macros,
        suggestions: suggestionResult.suggestions,
        meal_plan: null,
      },
    });

    return {
      alimentsDetectes: detectedFoods,
      macros,
      suggestions: suggestionResult.suggestions,
      anomalies,
    };
  }

  /**
   * Analyse l'équilibre nutritionnel d'un ensemble de macros
   * @param macros Macronutriments à analyser
   * @param userProfile Profil utilisateur
   * @returns Analyse d'équilibre avec anomalies détectées
   */
  async analyzeNutritionBalance(
    macros: MacroNutrients,
    userProfile: UserProfile,
  ): Promise<BalanceAnalysis> {
    this.logger.log(
      `Analyse équilibre nutrition pour profil: ${JSON.stringify(userProfile)}`,
    );

    const anomalies = this.anomalyDetector.detectForPipeline('nutrition', {
      ...macros,
      ...userProfile,
    });

    const isBalanced = anomalies.length === 0;

    return {
      isBalanced,
      anomalies,
    };
  }

  /**
   * Estime la nutrition d'un aliment inconnu avec fallback par défaut
   * @param foodName Nom de l'aliment inconnu
   * @returns Estimation nutritionnelle raisonnable
   */
  fallbackEstimateNutrition(foodName: string): FallbackNutrition {
    this.logger.log(`Fallback estimation pour aliment inconnu: ${foodName}`);

    // Estimations par défaut raisonnables (légume moyen)
    return {
      name: foodName,
      category: 'Unknown',
      calories_kcal: 50,
      protein_g: 2,
      carbohydrates_g: 10,
      fat_g: 0.3,
      fiber_g: 2,
      sugar_g: 3,
      sodium_mg: 50,
      cholesterol_mg: 0,
      meal_type_name: 'Other',
      water_intake_ml: 0,
      picture_url: null,
    };
  }

  /**
   * Réconcilie les aliments détectés avec la table Nutrition
   * @param detectedFoods Noms des aliments détectés
   * @returns Éléments nutritionnels trouvés en DB
   */
  async reconcileWithDatabase(detectedFoods: string[]): Promise<Nutrition[]> {
    if (detectedFoods.length === 0) {
      return [];
    }

    this.logger.debug(
      `Réconciliation DB pour aliments: ${detectedFoods.join(', ')}`,
    );

    const results = await this.prisma.nutrition.findMany({
      where: {
        name: {
          in: detectedFoods,
        },
      },
    });

    return results;
  }

  /**
   * Calcule les macros agrégées à partir d'une liste d'aliments
   * @param foods Aliments détectés
   * @returns Macros totales
   */
  computeAggregatedMacros(foods: Nutrition[]): MacroNutrients {
    if (foods.length === 0) {
      return {
        calories_kcal: 0,
        protein_g: 0,
        carbohydrates_g: 0,
        fat_g: 0,
        fiber_g: 0,
        sugar_g: 0,
        sodium_mg: 0,
        cholesterol_mg: 0,
      };
    }

    return foods.reduce(
      (acc, food) => ({
        calories_kcal: acc.calories_kcal + (food.calories_kcal ?? 0),
        protein_g: acc.protein_g + (food.protein_g ?? 0),
        carbohydrates_g: acc.carbohydrates_g + (food.carbohydrates_g ?? 0),
        fat_g: acc.fat_g + (food.fat_g ?? 0),
        fiber_g: acc.fiber_g + (food.fiber_g ?? 0),
        sugar_g: acc.sugar_g + (food.sugar_g ?? 0),
        sodium_mg: acc.sodium_mg + (food.sodium_mg ?? 0),
        cholesterol_mg: acc.cholesterol_mg + (food.cholesterol_mg ?? 0),
      }),
      {
        calories_kcal: 0,
        protein_g: 0,
        carbohydrates_g: 0,
        fat_g: 0,
        fiber_g: 0,
        sugar_g: 0,
        sodium_mg: 0,
        cholesterol_mg: 0,
      },
    );
  }

  /**
   * Génère des suggestions nutritionnelles personnalisées
   * @param macros Macros du repas
   * @param userProfile Profil utilisateur
   * @returns Suggestions adaptées au profil
   */
  async generateNutritionSuggestions(
    macros: MacroNutrients,
    userProfile: UserProfile,
  ): Promise<{ suggestions: string[] }> {
    const suggestions: string[] = [];
    const target = userProfile.daily_calories_target || 2000;
    const activityLevel =
      userProfile.physical_activity_level?.toLowerCase() || 'modere';

    // Suggestion calories
    if (macros.calories_kcal > target * 1.2) {
      suggestions.push(
        `Apport calorique élevé (${Math.round(macros.calories_kcal)} kcal). Ciblez ${target} kcal/jour.`,
      );
    } else if (macros.calories_kcal < target * 0.5) {
      suggestions.push(
        `Apport calorique faible (${Math.round(macros.calories_kcal)} kcal). Considérez ${target} kcal/jour.`,
      );
    }

    // Suggestion protéines selon activité
    if (
      activityLevel === 'athlete' ||
      activityLevel === 'avance' ||
      activityLevel === 'eleve'
    ) {
      const proteinTarget = (target * 0.35) / 4; // 35% cals from protein
      if (macros.protein_g < proteinTarget * 0.8) {
        suggestions.push(
          `Protéines faibles pour votre niveau d'activité (${macros.protein_g.toFixed(1)}g). Ciblez ≥${proteinTarget.toFixed(1)}g.`,
        );
      }
    }

    // Suggestion sucre
    if (macros.sugar_g > 50) {
      suggestions.push(
        `Sucre élevé (${macros.sugar_g.toFixed(1)}g). Recommandation : ≤50g/jour.`,
      );
    }

    // Suggestion sodium
    if (macros.sodium_mg > 2300) {
      suggestions.push(
        `Sodium élevé (${macros.sodium_mg.toFixed(0)}mg). Recommandation : ≤2300mg/jour.`,
      );
    }

    // Suggestion fibres
    if (macros.fiber_g < 20) {
      suggestions.push(
        `Fibres faibles (${macros.fiber_g.toFixed(1)}g). Ciblez ≥25g/jour.`,
      );
    }

    // Suggestion gras
    const fatCalories = macros.fat_g * 9;
    const fatPercent = (fatCalories / (macros.calories_kcal || 2000)) * 100;
    if (fatPercent > 40) {
      suggestions.push(
        `Graisse élevée (${fatPercent.toFixed(1)}% des calories). Ciblez 20-35%.`,
      );
    }

    // Message par défaut si aucune suggestion
    if (suggestions.length === 0) {
      suggestions.push(
        'Excellent équilibre nutritionnel ! Continuez ainsi.',
      );
    }

    return { suggestions };
  }

  /**
   * Récupère le profil utilisateur pour les suggestions personnalisées
   * @param userId ID de l'utilisateur
   * @returns Profil utilisateur avec health profile
   */
  private async getUserProfile(userId: number): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        healthProfile: true,
      },
    });

    if (!user) {
      return {};
    }

    return {
      age: user.date_of_birth
        ? Math.floor(
            (Date.now() - user.date_of_birth.getTime()) / (1000 * 60 * 60 * 24 * 365.25),
          )
        : undefined,
      gender: user.gender || undefined,
      daily_calories_target: user.healthProfile?.daily_calories_target || 2000,
      physical_activity_level:
        user.healthProfile?.physical_activity_level || 'modere',
    };
  }
}
