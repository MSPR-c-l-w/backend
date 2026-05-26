import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { WorkoutUserProfile } from 'src/ai/interfaces/workout-user-profile.interface';
import { WorkoutMicroserviceClient } from 'src/ai/workout-microservice/workout-microservice.client';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { SERVICES } from 'src/utils/constants';

export interface GenerateWorkoutResult {
  recommendationId: number;
  microserviceRefId: string;
  statut: string;
  program: Awaited<ReturnType<WorkoutMicroserviceClient['generateProgram']>>;
}

const DEFAULT_NIVEAU = 'debutant';

const ACTIVITY_LEVEL_TO_NIVEAU: Record<string, string> = {
  sedentaire: 'debutant',
  debutant: 'debutant',
  faible: 'debutant',
  modere: 'intermediaire',
  intermediaire: 'intermediaire',
  actif: 'intermediaire',
  eleve: 'avance',
  avance: 'avance',
  athlete: 'athlete',
};

@Injectable()
export class AiWorkoutService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(SERVICES.WORKOUT_MICROSERVICE_CLIENT)
    private readonly workoutClient: WorkoutMicroserviceClient,
  ) {}

  async generateForUser(userId: number): Promise<GenerateWorkoutResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        aiPreferences: true,
        healthProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('USER_NOT_FOUND');
    }

    if (!user.aiPreferences) {
      throw new BadRequestException('AI_PREFERENCES_REQUIRED');
    }

    const userProfile = this.buildUserProfile(
      user.aiPreferences,
      user.healthProfile,
    );
    const program = await this.workoutClient.generateProgram(
      userId,
      userProfile,
    );

    await this.prisma.aiWorkoutRecommendation.updateMany({
      where: { user_id: userId, statut: 'ACTIVE' },
      data: { statut: 'ARCHIVED' },
    });

    const recommendation = await this.prisma.aiWorkoutRecommendation.create({
      data: {
        user_id: userId,
        microservice_ref_id: program.programId,
        statut: 'ACTIVE',
      },
    });

    return {
      recommendationId: recommendation.id,
      microserviceRefId: recommendation.microservice_ref_id,
      statut: recommendation.statut,
      program,
    };
  }

  private buildUserProfile(
    preferences: {
      objectif_ia: string;
      contraintes_materielles: Prisma.JsonValue;
      regime: string | null;
      allergies: Prisma.JsonValue;
    },
    healthProfile: { physical_activity_level: string | null } | null,
  ): WorkoutUserProfile {
    const materiel = this.jsonStringArray(preferences.contraintes_materielles);
    const allergies = this.jsonStringArray(preferences.allergies);
    const preferencesList = preferences.regime ? [preferences.regime] : [];

    return {
      objectif: preferences.objectif_ia,
      niveau: this.resolveNiveau(healthProfile?.physical_activity_level),
      materiel,
      preferences: preferencesList,
      limitations: allergies,
    };
  }

  private resolveNiveau(
    physicalActivityLevel: string | null | undefined,
  ): string {
    if (!physicalActivityLevel?.trim()) {
      return DEFAULT_NIVEAU;
    }
    const normalized = physicalActivityLevel
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_');
    return ACTIVITY_LEVEL_TO_NIVEAU[normalized] ?? DEFAULT_NIVEAU;
  }

  private jsonStringArray(value: Prisma.JsonValue): string[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value.filter((item): item is string => typeof item === 'string');
  }
}
