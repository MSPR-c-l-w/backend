export interface EngagementSummary {
  days: number;
  averageDailyActivityMinutesPerUser: number;
  averageDailyCaloriesBurnedPerUser: number;
  averageIntensityPercent: number;
  totalActiveUsers: number;
}

export interface EngagementTimeseriesPoint {
  date: string;
  totalDurationHours: number;
  totalCalories: number;
  activeUsersPercent: number;
}

export interface ProgressionPoint {
  week: string;
  progressionPercent: number;
  satisfactionPercent: number;
}

export interface AgeBucket {
  label: string;
  total: number;
  male: number;
  female: number;
  other: number;
}

export interface PlanConversionItem {
  name: string;
  users: number;
}

export interface DemographicsConversion {
  ageBuckets: AgeBucket[];
  planConversion: PlanConversionItem[];
}

export interface NutritionTrendItem {
  profile: string;
  users: number;
  avgCalories: number;
  avgProtein: number;
}

export interface IAnalyticsService {
  getEngagementSummary(days?: number): Promise<EngagementSummary>;
  getEngagementTimeseries(days?: number): Promise<EngagementTimeseriesPoint[]>;
  getProgression(weeks?: number): Promise<ProgressionPoint[]>;
  getDemographicsConversion(): Promise<DemographicsConversion>;
  getNutritionTrends(): Promise<NutritionTrendItem[]>;
}

export interface IAnalyticsController {
  getEngagementSummary(days?: string): Promise<EngagementSummary>;
  getEngagementTimeseries(days?: string): Promise<EngagementTimeseriesPoint[]>;
  getProgression(weeks?: string): Promise<ProgressionPoint[]>;
  getDemographicsConversion(): Promise<DemographicsConversion>;
  getNutritionTrends(): Promise<NutritionTrendItem[]>;
}
