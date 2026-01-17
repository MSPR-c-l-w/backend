import { Controller, Get, Inject, Param, UseGuards } from '@nestjs/common';
import { ApiBadGatewayResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Exercise } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import type { IExerciceController, IExerciceService } from 'src/exercice/interfaces/exercice/exercice.interface';
import { SERVICES } from 'src/utils/constants';

@Controller('ROUTE_EXERCISE')
@UseGuards(JwtAuthGuard)
@ApiTags('ROUTE_EXERCISE')
export class ExerciceController implements IExerciceController {

    constructor(
        @Inject(SERVICES.EXERCISE) private readonly exerciceService: IExerciceService
    ) { }
    
    @Get()
    @ApiOperation({ summary: 'Récupérer tous les exercices' })
    @ApiOkResponse({ description: 'Liste des exercices'})
        
    async getExercices(): Promise<Exercise[]> {
        return this.exerciceService.getExercices();
    }
    
    @Get(':id')
    @ApiOperation({ summary: 'Récupérer un exercice par son ID' })
    @ApiOkResponse({ description: 'Exercice trouvé' })
    @ApiParam({ name: 'id', description: 'ID de l\'exercice' })
    @ApiNotFoundResponse({ description: 'Exercice non trouvé' })
    @ApiBadGatewayResponse({ description: 'Id de l\'exercice invalide' })
    async getExerciceById(@Param('id') id: number): Promise<Exercise> {
        return this.exerciceService.getExerciceById(id);
    }
}
