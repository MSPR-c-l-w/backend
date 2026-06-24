export interface DetectedFood {
  name: string;
  quantityG: number | null;
  confidence: number;
}

export interface MacroEstimate {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface FoodAnalysisResult {
  imageUrl: string;
  alimentsDetectes: DetectedFood[];
  macros: MacroEstimate;
  suggestions: string[];
  modelStatus: string;
}
