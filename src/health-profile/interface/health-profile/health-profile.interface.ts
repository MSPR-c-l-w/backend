import { HealthProfile } from '@prisma/client';

export interface IHealthProfileService {
  getHealthProfiles(): Promise<HealthProfile[]>;
  getHealthProfile(id: string): Promise<HealthProfile>;

  runHealthProfilePipeline(): Promise<number>;
}

export interface IHealthProfileController {
  getHealthProfiles(): Promise<HealthProfile[]>;
  getHealthProfile(id: string): Promise<HealthProfile>;
}