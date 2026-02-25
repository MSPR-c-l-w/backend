import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
} from 'src/organization/dtos/organization.dto';
import type {
  IOrganizationController,
  IOrganizationService,
} from 'src/organization/interfaces/organization.interfaces';
import { ROUTES, SERVICES } from 'src/utils/constants';
import { Organization } from 'src/utils/types';

@Controller(ROUTES.ORGANIZATIONS)
@ApiBearerAuth('access-token')
@ApiTags('organizations')
export class OrganizationController implements IOrganizationController {
  constructor(
    @Inject(SERVICES.ORGANIZATIONS)
    private readonly organizationService: IOrganizationService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lister les organisations (hors supprimées)' })
  @ApiOkResponse({ description: 'Liste des organisations' })
  getOrganizations(): Promise<Organization[]> {
    return this.organizationService.getOrganizations();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une organisation par id' })
  @ApiOkResponse({ description: 'Organisation' })
  getOrganizationById(@Param('id') id: string): Promise<Organization> {
    return this.organizationService.getOrganizationById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Créer une organisation' })
  @ApiBody({ type: CreateOrganizationDto })
  @ApiOkResponse({ description: 'Organisation créée' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  createOrganization(
    @Body() organization: CreateOrganizationDto,
  ): Promise<Organization> {
    return this.organizationService.createOrganization(organization);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour une organisation' })
  @ApiBody({ type: UpdateOrganizationDto })
  @ApiOkResponse({ description: 'Organisation mise à jour' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  updateOrganization(
    @Param('id') id: string,
    @Body() organization: UpdateOrganizationDto,
  ): Promise<Organization> {
    return this.organizationService.updateOrganization(id, organization);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer (soft-delete) une organisation' })
  @ApiOkResponse({ description: 'Organisation supprimée (soft)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  deleteOrganization(@Param('id') id: string): Promise<Organization> {
    return this.organizationService.deleteOrganization(id);
  }
}
