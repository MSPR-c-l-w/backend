import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { SERVICES } from 'src/utils/constants';
import { RolesGuard } from 'src/auth/guards/roles.guard';

describe('UsersController', () => {
  let controller: UsersController;
  const usersServiceMock = {
    getUsers: jest.fn(),
    getRoles: jest.fn(),
    getUserById: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    updateUserRole: jest.fn(),
    deleteUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: SERVICES.USERS,
          useValue: usersServiceMock,
        },
      ],
    })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
