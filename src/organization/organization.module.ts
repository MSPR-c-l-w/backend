import { Module } from '@nestjs/common';
import { OrganizationController } from './controllers/organization/organization.controller';
import { OrganizationService } from './services/organization/organization.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SERVICES } from 'src/utils/constants';

@Module({
  imports: [PrismaModule],
  controllers: [OrganizationController],
  providers: [
    OrganizationService,
    {
      provide: SERVICES.ORGANIZATIONS,
      useClass: OrganizationService,
    },
  ],
  exports: [OrganizationService],
})
export class OrganizationModule {}
