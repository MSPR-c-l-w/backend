import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import type {
  IRoleController,
  IRoleService,
} from 'src/roles/interfaces/role.interface';
import { ROUTES, SERVICES } from 'src/utils/constants';

@Controller(ROUTES.ROLES)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth('access-token')
@ApiTags(ROUTES.ROLES)
export class RolesController implements IRoleController {
  constructor(
    @Inject(SERVICES.ROLES) private readonly rolesService: IRoleService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les rôles' })
  @ApiOkResponse({ description: 'Liste des rôles' })
  getRoles(): Promise<Role[]> {
    return this.rolesService.getRoles();
  }
}
