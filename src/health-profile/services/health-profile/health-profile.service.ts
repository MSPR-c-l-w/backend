import { Injectable, NotFoundException } from '@nestjs/common';
import { HealthProfile } from '@prisma/client';
import { IHealthProfileService } from 'src/health-profile/interface/health-profile/health-profile.interface';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
@Injectable()
export class HealthProfileService implements IHealthProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getHealthProfiles(): Promise<HealthProfile[]> {
    const healthProfiles = await this.prisma.healthProfile.findMany();
    if (healthProfiles.length === 0) {
      throw new NotFoundException('NO_HEALTH_PROFILES_FOUND');
    }

    return healthProfiles;
  }

  async getHealthProfile(id: string): Promise<HealthProfile> {
    const healthProfile = await this.prisma.healthProfile.findUnique({
      where: { id: parseInt(id) },
    });

    if (!healthProfile) {
      throw new Error('HEALTH_PROFILE_NOT_FOUND');
    }

    return healthProfile;
  }
}
