import type { Request } from 'express';
import { HealthProfile } from '@prisma/client';

export interface IHealthProfileService {
  getHealthProfiles(): Promise<HealthProfile[]>;
  getHealthProfile(id: string): Promise<HealthProfile>;
  getMyHealthProfile(userId: number): Promise<HealthProfile>;
  runHealthProfilePipeline(): Promise<number>;
}

export interface IHealthProfileController {
  getHealthProfiles(): Promise<HealthProfile[]>;
  getHealthProfile(id: string): Promise<HealthProfile>;
  getMyHealthProfile(req: Request): Promise<HealthProfile>;
}
