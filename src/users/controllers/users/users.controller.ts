import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CreateUserDto } from 'src/users/dtos/create.user.dto';
import { UpdateUserDto } from 'src/users/dtos/update.user.dto';
import { UpdateUserRoleDto } from 'src/users/dtos/update-user-role.dto';
import type {
  IUsersController,
  IUsersService,
  PaginatedUsersResponse,
} from 'src/users/interfaces/users.interface';
import { ROUTES, SERVICES } from 'src/utils/constants';
import { User } from 'src/utils/types';
import { ApiBearerAuth } from '@nestjs/swagger';
import { GetUsersDto } from 'src/users/dtos/get.users.dto';

@ApiBearerAuth('access-token')
@Controller(ROUTES.USERS)
export class UsersController implements IUsersController {
  constructor(
    @Inject(SERVICES.USERS) private readonly usersService: IUsersService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COACH', 'ADMIN')
  getUsers(
    @Query() query: GetUsersDto,
  ): Promise<User[] | PaginatedUsersResponse> {
    return this.usersService.getUsers(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COACH', 'ADMIN')
  getUserById(@Param('id') id: string): Promise<User> {
    return this.usersService.getUserById(id);
  }

  @Post()
  createUser(@Body() user: CreateUserDto): Promise<User> {
    return this.usersService.createUser(user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  updateUser(
    @Param('id') id: string,
    @Body() user: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.updateUser(id, user);
  }

  @Patch(':id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  updateUserRole(
    @Param('id') id: string,
    @Body() userRole: UpdateUserRoleDto,
  ): Promise<User> {
    return this.usersService.updateUserRole(id, userRole);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  deleteUser(@Param('id') id: string): Promise<User> {
    return this.usersService.deleteUser(id);
  }
}
