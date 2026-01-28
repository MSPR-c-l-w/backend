import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { OrganizationModule } from './organization/organization.module';
import { ExerciceModule } from './exercice/exercice.module';
import { NutritionModule } from './nutrition/nutrition.module';
import { PlanModule } from './plan/plan.module';
import { Exercise_LogModule } from './exercise-log/exercise-log.module';
import { WorkoutSessionModule } from './workout-session/workout-session.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    PrismaModule,
    OrganizationModule,
    NutritionModule,
    ExerciceModule,
    PlanModule,
    Exercise_LogModule,
    WorkoutSessionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
