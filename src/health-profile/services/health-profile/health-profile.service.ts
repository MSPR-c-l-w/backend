import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { HealthProfile } from '@prisma/client';
import { IHealthProfileService } from 'src/health-profile/interface/health-profile/health-profile.interface';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import * as Papa from 'papaparse';

@Injectable()
export class HealthProfileService implements IHealthProfileService {
  private readonly logger = new Logger(HealthProfileService.name);
  private readonly KAGGLE_USER = process.env.KAGGLE_USER;
  private readonly KAGGLE_KEY = process.env.KAGGLE_KEY;
  private readonly DATASET_URL = 'https://www.kaggle.com/api/v1/datasets/download/ziya07/diet-recommendations-dataset/diet_recommendations_dataset.csv';

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}
  async runHealthProfilePipeline(): Promise<number>{
    try {
      await this.prisma.user.upsert({
        where: { id:1 },
        update: {},
        create: {
          id: 1,
          email: 'admin@test.fr',
          password_hash: 'hash',
          first_name: 'Jeff',
          last_name: 'Leote',
        },
      });

      const auth = Buffer.from(
        `${this.KAGGLE_USER}:${this.KAGGLE_KEY}`,
      ).toString('base64');

      const response = await lastValueFrom(
        this.httpService.get(this.DATASET_URL, {
          headers: {
            Authorization: `Basic ${auth}`,
            Accept: 'application/octet-stream'
          },
          responseType: 'text',
        }),
      );

      const parsed = Papa.parse(response.data, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
      });
      const rows = parsed.data as any[];

      await this.prisma.healthProfile.deleteMany({});
      await this.prisma.$executeRaw`ALTER TABLE HealthProfile AUTO_INCREMENT = 1`;

      let importedCount = 0;

      for (const row of rows) {

        const healthProfile = {
          user_id: row['user_id'] || 1,
          weight: row ['Weight_kg'] || row['weight_kg'] || null,
          bmi: row ['BMI'] || row['bmi'] || null,
          disease_type: row['Disease'] || row ['Disease_Type'] || row['disease_type'] || null,
          severity: row['Severity'] || row['severity'] || null,
          physical_activity_level: row['Physical_Activity_Level'] || row['Physical_Activity'] || row['physical_activity_level'] || null,
          daily_calories_target: row['Daily_Caloric_Intake'] || row['Daily_Calories'] || row['Calories_Target'] || row['daily_calories_target'] || null,
        };

        await this.prisma.healthProfile.create({
          data: healthProfile,
        });
        importedCount++;
      }

      this.logger.log(`Import réussi : ${importedCount} profils importés`);
      return importedCount;
    } catch (e) {
      this.logger.error(`Erreur ETL: ${e.message}`);
      throw e;
    }
  }
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
