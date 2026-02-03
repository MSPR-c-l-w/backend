import { HealthProfile } from '@prisma/client';

export interface IHealthProfileService {
  getHealthProfiles(): Promise<HealthProfile[]>;
  getHealthProfile(id: string): Promise<HealthProfile>;

  runHealthProfilePipeline(): Promise<number>;
  redistributeUserIds(): Promise<{ updated: number; usersCreated: number }>;
}

export interface IHealthProfileController {
  getHealthProfiles(): Promise<HealthProfile[]>;
  getHealthProfile(id: string): Promise<HealthProfile>;
}
