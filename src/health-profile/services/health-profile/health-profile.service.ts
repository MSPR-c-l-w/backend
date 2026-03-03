/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { HealthProfile } from '@prisma/client';
import { IHealthProfileService } from 'src/health-profile/interface/health-profile/health-profile.interface';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { EtlService } from 'src/etl/services/etl/etl.service';
import { lastValueFrom } from 'rxjs';
import * as Papa from 'papaparse';

@Injectable()
export class HealthProfileService implements IHealthProfileService {
  private readonly logger = new Logger(HealthProfileService.name);
  private readonly KAGGLE_USER = process.env.KAGGLE_USER;
  private readonly KAGGLE_KEY = process.env.KAGGLE_KEY;
  private readonly DATASET_URL =
    'https://www.kaggle.com/api/v1/datasets/download/ziya07/diet-recommendations-dataset/diet_recommendations_dataset.csv';

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly etl: EtlService,
  ) {}
  async runHealthProfilePipeline(): Promise<number> {
    try {
      this.etl.emit(
        'health-profile',
        'INFO',
        '--- Début pipeline ETL HealthProfile ---',
      );
      const users = await this.prisma.user.findMany({
        select: { id: true },
        orderBy: { id: 'asc' },
      });
      if (users.length === 0) {
        throw new BadRequestException(
          'NO_USERS_SEEDED: seed la table User avant de lancer le pipeline HealthProfile',
        );
      }

      const auth = Buffer.from(
        `${this.KAGGLE_USER}:${this.KAGGLE_KEY}`,
      ).toString('base64');

      const response = await lastValueFrom(
        this.httpService.get(this.DATASET_URL, {
          headers: {
            Authorization: `Basic ${auth}`,
            Accept: 'application/octet-stream',
          },
          responseType: 'text',
        }),
      );

      const parsed = Papa.parse(response.data, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
      });
      const rows = parsed.data as Record<string, unknown>[];

      let importedCount = 0;

      for (const [index, row] of rows.entries()) {
        const userId = users[index % users.length].id;
        const cleanedData = {
          user_id: userId,
          weight: row['Weight_kg'] ?? row['weight_kg'] ?? null,
          bmi: row['BMI'] ?? row['bmi'] ?? null,
          physical_activity_level:
            row['Physical_Activity_Level'] ??
            row['Physical_Activity'] ??
            row['physical_activity_level'] ??
            null,
          daily_calories_target:
            row['Daily_Caloric_Intake'] ??
            row['Daily_Calories'] ??
            row['Calories_Target'] ??
            row['daily_calories_target'] ??
            null,
        };

        // Nécessaire quand l'IDE ne résout pas le type Prisma (healthProfileStaging vu comme "error")
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        await this.prisma.healthProfileStaging.create({
          data: {
            cleaned_data: cleanedData,
            anomalies: [],
          },
        });
        importedCount++;
      }

      const successMsg = `Import staging réussi : ${importedCount} profils en PENDING.`;
      this.logger.log(successMsg);
      this.etl.emit('health-profile', 'SUCCESS', successMsg);
      return importedCount;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      this.logger.error(`Erreur ETL: ${message}`);
      this.etl.emit('health-profile', 'ERROR', `Erreur ETL: ${message}`);
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
      throw new NotFoundException('HEALTH_PROFILE_NOT_FOUND');
    }

    return healthProfile;
  }
  async redistributeUserIds(): Promise<{
    updated: number;
    usersCreated: number;
  }> {
    try {
      const usersCreated = 0;
      const profiles = await this.prisma.healthProfile.findMany({
        where: { user_id: 1 },
      });

      if (profiles.length === 0) {
        this.logger.warn('Aucun profil avec user_id 1 trouvé');
        return { updated: 0, usersCreated: 0 };
      }

      const userIds = await this.prisma.user.findMany({
        select: { id: true },
        orderBy: { id: 'asc' },
      });
      if (userIds.length === 0) {
        throw new BadRequestException(
          'NO_USERS_SEEDED: seed la table User avant de redistribuer les user_id',
        );
      }

      let updated = 0;
      const profilesPerUser = 500;
      for (let i = 0; i < profiles.length; i++) {
        const bucket = Math.floor(i / profilesPerUser);
        const targetUserId = userIds[bucket % userIds.length].id;

        await this.prisma.healthProfile.update({
          where: { id: profiles[i].id },
          data: { user_id: targetUserId },
        });

        updated++;
      }

      this.logger.log(
        `Redistribution terminée : ${updated} profils mis à jour, ${usersCreated} utilisateurs créés`,
      );
      this.etl.emit(
        'health-profile',
        'SUCCESS',
        `Redistribution terminée : ${updated} profils mis à jour, ${usersCreated} utilisateurs créés`,
      );

      return { updated, usersCreated };
    } catch (e) {
      this.logger.error(`Erreur redistribution des user_ids: ${e.message}`);
      this.etl.emit(
        'health-profile',
        'ERROR',
        `Erreur redistribution des user_ids: ${e.message}`,
      );
      throw e;
    }
  }
}
