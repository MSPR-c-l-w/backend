import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { SERVICES } from 'src/utils/constants';

describe('UsersController', () => {
  let controller: UsersController;
  const usersServiceMock = {
    getUsers: jest.fn(),
    getUserById: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
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
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
