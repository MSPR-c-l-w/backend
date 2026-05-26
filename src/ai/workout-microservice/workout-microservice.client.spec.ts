import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosError } from 'axios';
import { of, throwError } from 'rxjs';
import { WorkoutMicroserviceUnavailableException } from 'src/ai/exceptions/workout-microservice.exception';
import type { WorkoutUserProfile } from 'src/ai/interfaces/workout-user-profile.interface';
import { WorkoutMicroserviceClient } from './workout-microservice.client';

describe('WorkoutMicroserviceClient', () => {
  let client: WorkoutMicroserviceClient;
  let httpService: { post: jest.Mock };

  const profile: WorkoutUserProfile = {
    objectif: 'renforcement',
    niveau: 'debutant',
    materiel: ['tapis'],
    preferences: [],
    limitations: ['mal au genou'],
  };

  const microserviceResponse = {
    programId: '665a1b2c3d4e5f6789012345',
    userId: 42,
    statut: 'ACTIVE',
    programme: [],
    generatedAt: '2026-05-16T12:00:00.000Z',
  };

  beforeEach(async () => {
    process.env.WORKOUT_SERVICE_URL = 'http://localhost:8000';
    process.env.WORKOUT_SERVICE_API_KEY = 'test-api-key';

    httpService = {
      post: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkoutMicroserviceClient,
        {
          provide: HttpService,
          useValue: httpService,
        },
      ],
    }).compile();

    client = module.get(WorkoutMicroserviceClient);
  });

  afterEach(() => {
    delete process.env.WORKOUT_SERVICE_URL;
    delete process.env.WORKOUT_SERVICE_API_KEY;
  });

  it('appelle le micro-service et retourne le programme', async () => {
    httpService.post.mockReturnValue(of({ data: microserviceResponse }));

    const result = await client.generateProgram(42, profile);

    expect(result).toEqual(microserviceResponse);
    expect(httpService.post).toHaveBeenCalledWith(
      'http://localhost:8000/recommendations/workout',
      {
        userId: 42,
        objectif: profile.objectif,
        niveau: profile.niveau,
        materiel: profile.materiel,
        preferences: profile.preferences,
        limitations: profile.limitations,
      },
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-API-Key': 'test-api-key',
        }) as Record<string, string>,
        timeout: 10_000,
      }),
    );
  });

  it('lève WorkoutMicroserviceUnavailableException en cas d erreur réseau', async () => {
    const axiosError = new AxiosError('ECONNREFUSED');
    httpService.post.mockReturnValue(throwError(() => axiosError));

    await expect(client.generateProgram(42, profile)).rejects.toBeInstanceOf(
      WorkoutMicroserviceUnavailableException,
    );
  });

  it('lève si la configuration est absente', async () => {
    delete process.env.WORKOUT_SERVICE_URL;
    const unconfigured = new WorkoutMicroserviceClient(
      httpService as HttpService,
    );

    await expect(
      unconfigured.generateProgram(42, profile),
    ).rejects.toBeInstanceOf(WorkoutMicroserviceUnavailableException);
  });
});
