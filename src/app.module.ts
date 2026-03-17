import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { PrismaModule } from './prisma/prisma.module';
import { OrganizationModule } from './organization/organization.module';
import { ExerciceModule } from './exercice/exercice.module';
import { NutritionModule } from './nutrition/nutrition.module';
import { PlanModule } from './plan/plan.module';
import { SessionExerciseModule } from './session-exercise/session-exercise.module';
import { SessionModule } from './session/session.module';
import { HealthProfileModule } from './health-profile/health-profile.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { EtlModule } from './etl/etl.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ApiMetricsInterceptor } from 'src/analytics/interceptors/api-metrics.interceptor';
import { CsrfGuard } from 'src/auth/guards/csrf.guard';
import { EtlWeeklySchedulerService } from 'src/etl/services/etl-weekly-scheduler/etl-weekly-scheduler.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    RolesModule,
    AnalyticsModule,
    PrismaModule,
    OrganizationModule,
    NutritionModule,
    ExerciceModule,
    PlanModule,
    SessionExerciseModule,
    SessionModule,
    HealthProfileModule,
    SubscriptionModule,
    EtlModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    EtlWeeklySchedulerService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiMetricsInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
  ],
})
export class AppModule {}
