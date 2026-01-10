import { Body, Controller, Delete, Get, Inject, Param, Post, Put } from '@nestjs/common';
import { CreateUserDto } from 'src/users/dtos/create.user.dto';
import { UpdateUserDto } from 'src/users/dtos/update.user.dto';
import type { IUsersController, IUsersService } from 'src/users/interfaces/users.interface';
import { ROUTES, SERVICES } from 'src/utils/constants';
import { User } from 'src/utils/types';


@Controller(ROUTES.USERS)
export class UsersController implements IUsersController {

    constructor(
        @Inject(SERVICES.USERS) private readonly usersService: IUsersService
    ) {}

    @Get()
    getUsers(): Promise<User[]> {
        return this.usersService.getUsers();
    }

    @Get(':id')
    getUserById(
        @Param('id') id: string
    ): Promise<User> {
        return this.usersService.getUserById(id);
    }

    @Post()
    createUser(
        @Body() user: CreateUserDto
    ): Promise<User> {
        return this.usersService.createUser(user);
    }

    @Put(':id')
    updateUser(
        @Param('id') id: string, 
        @Body() user: UpdateUserDto
    ): Promise<User> {
        return this.usersService.updateUser(id, user);
    }

    @Delete(':id')
    deleteUser(
        @Param('id') id: string
    ): Promise<User> {
        return this.usersService.deleteUser(id);
    }
    
}
