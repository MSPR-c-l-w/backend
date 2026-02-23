/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CreateRoleDto, UpdateRoleDto } from 'src/role/dtos/role.dto';
import type {
  IRoleController,
  IRoleService,
} from 'src/role/interfaces/role.interface';
import { ROUTES, SERVICES } from 'src/utils/constants';

@Controller(ROUTES.ROLE)
@ApiTags(ROUTES.ROLE)
export class RoleController implements IRoleController {
  constructor(
    @Inject(SERVICES.ROLE)
    private readonly roleService: IRoleService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lister les rôles' })
  @ApiOkResponse({ description: 'Liste des rôles' })
  getRoles(): Promise<Role[]> {
    return this.roleService.getRoles();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un rôle par id' })
  @ApiOkResponse({ description: 'Rôle' })
  getRoleById(@Param('id') id: string): Promise<Role> {
    return this.roleService.getRoleById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Créer un rôle' })
  @ApiBody({ type: CreateRoleDto })
  @ApiOkResponse({ description: 'Rôle créé' })
  createRole(@Body() role: CreateRoleDto): Promise<Role> {
    return this.roleService.createRole(role);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un rôle' })
  @ApiBody({ type: UpdateRoleDto })
  @ApiOkResponse({ description: 'Rôle mis à jour' })
  updateRole(
    @Param('id') id: string,
    @Body() role: UpdateRoleDto,
  ): Promise<Role> {
    return this.roleService.updateRole(id, role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un rôle' })
  @ApiOkResponse({ description: 'Rôle supprimé' })
  deleteRole(@Param('id') id: string): Promise<Role> {
    return this.roleService.deleteRole(id);
  }
}
