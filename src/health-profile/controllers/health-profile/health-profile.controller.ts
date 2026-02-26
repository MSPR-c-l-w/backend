import {
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { HealthProfile } from '@prisma/client';
import type { Request } from 'express';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import type { JwtPayload } from 'src/auth/strategies/jwt.strategy';
import type {
  IHealthProfileController,
  IHealthProfileService,
} from 'src/health-profile/interface/health-profile/health-profile.interface';
import { ROUTES, SERVICES } from 'src/utils/constants';

@Controller(ROUTES.HEALTH_PROFILE)
@ApiTags(ROUTES.HEALTH_PROFILE)
@UseGuards(JwtAuthGuard)
export class HealthProfileController implements IHealthProfileController {
  constructor(
    @Inject(SERVICES.HEALTH_PROFILE)
    private readonly healthProfileService: IHealthProfileService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les profils de santé' })
  @ApiOkResponse({
    description: 'Liste des profils de santé récupérée avec succès',
  })
  @ApiUnauthorizedResponse({ description: 'JWT invalide ou expiré' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COACH', 'ADMIN')
  getHealthProfiles(): Promise<HealthProfile[]> {
    return this.healthProfileService.getHealthProfiles();
  }

  @Get('me')
  @ApiOperation({
    summary: 'Récupérer mon propre profil de santé (utilisateur connecté)',
  })
  @ApiOkResponse({
    description: 'Profil de santé de l’utilisateur connecté',
  })
  @ApiNotFoundResponse({
    description: 'Profil de santé non trouvé pour cet utilisateur',
  })
  @ApiUnauthorizedResponse({ description: 'JWT invalide ou expiré' })
  @ApiBearerAuth('access-token')
  getMyHealthProfile(@Req() req: Request): Promise<HealthProfile> {
    const payload = req.user as JwtPayload;

    return this.healthProfileService.getHealthProfile(payload.sub.toString());
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un profil de santé par id' })
  @ApiOkResponse({ description: 'Profil de santé correspondant à l’id' })
  @ApiParam({ name: 'id', description: 'ID du profil de santé' })
  @ApiNotFoundResponse({ description: 'Profil de santé non trouvé' })
  @ApiBadRequestResponse({ description: 'ID invalide' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COACH', 'ADMIN')
  getHealthProfile(@Param('id') id: string): Promise<HealthProfile> {
    return this.healthProfileService.getHealthProfile(id);
  }

  @Post('import')
  @ApiOperation({
    summary:
      'Déclencher la pipeline ETL pour importer les profils de santé depuis Kaggle et redistribuer automatiquement les user_id',
  })
  @ApiOkResponse({ description: 'Importation et redistribution réussies' })
  @ApiInternalServerErrorResponse({
    description: 'Erreur lors du traitement du fichier CSV',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async triggerImport(): Promise<{
    message: string;
    imported: number;
    updated: number;
    usersCreated: number;
  }> {
    const imported = await this.healthProfileService.runHealthProfilePipeline();
    return {
      message:
        'Le pipeline ETL HealthProfile a été exécuté avec succès et les user_id ont été redistribués.',
      imported: imported,
      updated: imported,
      usersCreated: 0,
    };
  }
}
