import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { isAxiosError } from 'axios';
import { lastValueFrom } from 'rxjs';
import { WorkoutMicroserviceUnavailableException } from 'src/ai/exceptions/workout-microservice.exception';
import type {
  WorkoutProgramFromMicroservice,
  WorkoutUserProfile,
} from 'src/ai/interfaces/workout-user-profile.interface';

const REQUEST_TIMEOUT_MS = 10_000;

@Injectable()
export class WorkoutMicroserviceClient {
  private readonly logger = new Logger(WorkoutMicroserviceClient.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(private readonly httpService: HttpService) {
    this.baseUrl = (process.env.WORKOUT_SERVICE_URL ?? '').replace(/\/$/, '');
    this.apiKey = process.env.WORKOUT_SERVICE_API_KEY ?? '';
  }

  async generateProgram(
    userId: number,
    userProfile: WorkoutUserProfile,
  ): Promise<WorkoutProgramFromMicroservice> {
    if (!this.baseUrl || !this.apiKey) {
      throw new WorkoutMicroserviceUnavailableException(
        'WORKOUT_MICROSERVICE_NOT_CONFIGURED',
      );
    }

    const url = `${this.baseUrl}/recommendations/workout`;

    try {
      const response = await lastValueFrom(
        this.httpService.post<WorkoutProgramFromMicroservice>(
          url,
          {
            userId,
            objectif: userProfile.objectif,
            niveau: userProfile.niveau,
            materiel: userProfile.materiel,
            preferences: userProfile.preferences,
            limitations: userProfile.limitations,
          },
          {
            headers: {
              'X-API-Key': this.apiKey,
              'Content-Type': 'application/json',
            },
            timeout: REQUEST_TIMEOUT_MS,
          },
        ),
      );

      return response.data;
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        this.logger.warn(
          `Appel micro-service workout échoué: ${error.code ?? error.message}`,
        );
      } else {
        this.logger.warn(
          `Appel micro-service workout échoué: ${String(error)}`,
        );
      }
      throw new WorkoutMicroserviceUnavailableException();
    }
  }
}
