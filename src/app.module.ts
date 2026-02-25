import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PrismaModule } from './prisma/prisma.module';
import { OrganizationModule } from './organization/organization.module';
import { ExerciceModule } from './exercice/exercice.module';
import { NutritionModule } from './nutrition/nutrition.module';
import { PlanModule } from './plan/plan.module';
import { SessionExerciseModule } from './session-exercise/session-exercise.module';
import { SessionModule } from './session/session.module';
import { HealthProfileModule } from './health-profile/health-profile.module';
import { SubscriptionModule } from './subscription/subscription.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    RolesModule,
    PrismaModule,
    OrganizationModule,
    NutritionModule,
    ExerciceModule,
    PlanModule,
    SessionExerciseModule,
    SessionModule,
    HealthProfileModule,
    SubscriptionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
