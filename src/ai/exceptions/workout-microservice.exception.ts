import { ServiceUnavailableException } from '@nestjs/common';

export class WorkoutMicroserviceUnavailableException extends ServiceUnavailableException {
  constructor(message = 'WORKOUT_MICROSERVICE_UNAVAILABLE') {
    super(message);
  }
}
