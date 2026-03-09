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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUsers', () => {
    it('sans query: appelle le service sans arg et retourne un tableau', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const users = [{ id: 1 }, { id: 2 }] as any;
      usersServiceMock.getUsers.mockResolvedValue(users);

      const result = await controller.getUsers({});

      expect(result).toEqual(users);
      expect(usersServiceMock.getUsers).toHaveBeenCalledTimes(1);
      expect(usersServiceMock.getUsers).toHaveBeenCalledWith({});
    });

    it('avec query page/limit: appelle le service et retourne { data, total }', async () => {
      const paginated = { data: [{ id: 1 }], total: 50 };
      usersServiceMock.getUsers.mockResolvedValue(paginated);

      const result = await controller.getUsers({
        page: 2,
        limit: 10,
      });

      expect(result).toEqual(paginated);
      expect(usersServiceMock.getUsers).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
      });
    });
  });
});
