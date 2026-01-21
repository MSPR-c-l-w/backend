import { Module } from '@nestjs/common';
import { ExerciseLogService } from './services/exercise-log/exercise-log.service';
import { ExerciseLogController } from './controllers/exercise-log/exercise-log.controller';

@Module({
  providers: [ExerciseLogService],
  controllers: [ExerciseLogController]
})
export class ExerciseLogModule {}
