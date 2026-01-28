import { Module } from '@nestjs/common';
import { Exercise_LogService } from './services/exercise-log/exercise-log.service';
import { Exercise_LogController } from './controllers/exercise-log/exercise-log.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SERVICES } from 'src/utils/constants';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    PrismaModule, 
    HttpModule // Indispensable pour l'importation du CSV Kaggle via HTTP
  ],
  providers: [
    Exercise_LogService,
    {
      provide: SERVICES.EXERCISE_LOG, // Utilise ton token constant pour l'injection
      useClass: Exercise_LogService,
    },
  ],
  controllers: [Exercise_LogController],
  exports: [
    Exercise_LogService, // Export direct pour les tests internes
    {
      provide: SERVICES.EXERCISE_LOG, // Export du token pour les autres modules
      useClass: Exercise_LogService,
    },
  ],
})
export class Exercise_LogModule {}