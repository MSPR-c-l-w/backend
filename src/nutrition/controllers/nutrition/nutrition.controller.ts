import { Controller, Get, Inject, Param, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Nutrition } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import type { INutritionController, INutritionService } from 'src/nutrition/interfaces/nutrition/nutrition.interface';
import { ROUTES, SERVICES } from 'src/utils/constants';

@Controller(ROUTES.NUTRITION)
@UseGuards(JwtAuthGuard)
@ApiTags(ROUTES.NUTRITION)
export class NutritionController implements INutritionController {

    constructor(
        @Inject(SERVICES.NUTRITION) private readonly nutritionService: INutritionService
    ) {}

    @Get()
    @ApiOperation({ summary: 'Récupérer toutes les nutriments' })
    @ApiOkResponse({ description: 'Liste des nutriments' })
    async getNutritions(): Promise<Nutrition[]> {
        return this.nutritionService.getNutritions();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Récupérer un nutriment par id' })
    @ApiOkResponse({ description: 'Nutriment' })
    @ApiParam({ name: 'id', description: 'ID du nutriment' })
    @ApiNotFoundResponse({ description: 'Nutriment non trouvé' })
    @ApiBadRequestResponse({ description: 'ID du nutriment invalide' })
    async getNutritionById(@Param('id') id: string): Promise<Nutrition> {
        return this.nutritionService.getNutritionById(id);
    }

}
