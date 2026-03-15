export class DashboardPilotageDto {
  kpis: {
    dataQuality: { value: string; trend: string };
    activeUsers: { value: string; trend: string };
    premiumConversion: { value: string; trend: string };
    pipelineErrors: { value: string; trend: string };
  };
  dataQualityTrend: { date: string; quality: number; errors: number }[];
  ageDistribution: { name: string; value: number }[];
  objectivesData: { name: string; value: number; color: string }[];
  alerts: { id: number; type: string; message: string; time: string }[];
}
