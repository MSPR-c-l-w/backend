import { HealthProfile } from "@prisma/client";

export interface IHealthProfileService {
    getHealthProfiles(): Promise<HealthProfile[]>;
    getHealthProfile(id: string): Promise<HealthProfile>;
}

export interface IHealthProfileController {
    getHealthProfiles(): Promise<HealthProfile[]>;
    getHealthProfile(id: string): Promise<HealthProfile>;
}
