import { Controller, Get, Inject, Param, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Subscription } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import type { ISubscriptionController, ISubscriptionService } from 'src/subscription/interface/subscription/subscription.interface';
import { ROUTES, SERVICES } from 'src/utils/constants';

@Controller(ROUTES.SUBSCRIPTION)
@UseGuards(JwtAuthGuard)
@ApiTags(ROUTES.SUBSCRIPTION)
export class SubscriptionController implements ISubscriptionController {

    constructor(
        @Inject(SERVICES.SUBSCRIPTION) private readonly subscriptionService: ISubscriptionService
    ) {}

    @Get()
    @ApiOperation({ summary: 'Récupérer toutes les abonnements' })
    @ApiOkResponse({ description: 'Abonnements' })
    async getSubscriptions(): Promise<Subscription[]> {
        return this.subscriptionService.getSubscriptions();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Récupérer un abonnement par id' })
    @ApiOkResponse({ description: 'Abonnement' })
    @ApiParam({ name: 'id', description: 'ID de l\'abonnement' })
    @ApiNotFoundResponse({ description: 'Abonnement non trouvé' })  
    @ApiBadRequestResponse({ description: 'ID de l\'abonnement invalide' })
    async getSubscriptionById(@Param('id') id: string): Promise<Subscription> {
        return this.subscriptionService.getSubscriptionById(id);
    }
    
}
