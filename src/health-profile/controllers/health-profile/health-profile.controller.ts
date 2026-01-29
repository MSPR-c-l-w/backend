import { Controller, Get, Inject, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiTags, ApiParam, ApiNotFoundResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { HealthProfile } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import type { IHealthProfileController, IHealthProfileService } from 'src/health-profile/interface/health-profile/health-profile.interface';
import { ROUTES, SERVICES } from 'src/utils/constants';

@Controller(ROUTES.HEALTH_PROFILE)
@UseGuards(JwtAuthGuard)
@ApiTags(ROUTES.HEALTH_PROFILE)
export class HealthProfileController implements IHealthProfileController {
    constructor(
        @Inject(SERVICES.HEALTH_PROFILE) private readonly healthProfileService: IHealthProfileService
    ) {}

    @Get()
    @ApiOperation({ summary: 'Récupérer tous les profils de santé' })
    @ApiOkResponse({ description: 'Profils de santé' })
    async getHealthProfiles(): Promise<HealthProfile[]> {
        return this.healthProfileService.getHealthProfiles();
    }
    
    @Get(':id')
    @ApiOperation({ summary: 'Récupérer un profil de santé par id' })
    @ApiOkResponse({ description: 'Profil de santé' })
    @ApiParam({ name: 'id', description: 'ID du profil de santé' })
    @ApiNotFoundResponse({ description: 'Profil de santé non trouvé' })
    @ApiBadRequestResponse({ description: 'ID invalide' })
    async getHealthProfile(@Param('id') id: string): Promise<HealthProfile> {
        return this.healthProfileService.getHealthProfile(id);
    }
}
