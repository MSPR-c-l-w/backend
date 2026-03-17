import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { SERVICES } from 'src/utils/constants';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

describe('UsersController', () => {
  let controller: UsersController;
  const usersServiceMock = {
    getUsers: jest.fn(),
    getUsersStats: jest.fn(),
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
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
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

  describe('getUsersStats', () => {
    it('appelle le service et retourne les stats', async () => {
      const stats = {
        totalUsers: 100,
        activeUsers: 60,
        premiumUsers: 20,
        b2bUsers: 10,
      };
      usersServiceMock.getUsersStats.mockResolvedValue(stats);

      const result = await controller.getUsersStats();

      expect(result).toEqual(stats);
      expect(usersServiceMock.getUsersStats).toHaveBeenCalledTimes(1);
    });
  });

  describe('getUserById', () => {
    it('appelle le service avec l’id et retourne le user', async () => {
      const user = { id: 42, email: 'u@test.com' };
      usersServiceMock.getUserById.mockResolvedValue(user);

      const result = await controller.getUserById('42');

      expect(result).toEqual(user);
      expect(usersServiceMock.getUserById).toHaveBeenCalledWith('42');
    });
  });

  describe('createUser', () => {
    it('passe le body au service et retourne le user créé', async () => {
      const dto = {
        email: 'new@test.com',
        password: 'secret',
        first_name: 'Jean',
        last_name: 'Dupont',
        date_of_birth: '1990-01-01',
        gender: 'Male',
        height: 175,
      };
      const created = { id: 1, ...dto };
      usersServiceMock.createUser.mockResolvedValue(created);

      const result = await controller.createUser(dto);

      expect(result).toEqual(created);
      expect(usersServiceMock.createUser).toHaveBeenCalledWith(dto);
    });
  });

  describe('updateUser', () => {
    it('passe id et body au service et retourne le user mis à jour', async () => {
      const dto = { first_name: 'Updated' };
      const updated = { id: 1, first_name: 'Updated' };
      usersServiceMock.updateUser.mockResolvedValue(updated);

      const result = await controller.updateUser('1', dto);

      expect(result).toEqual(updated);
      expect(usersServiceMock.updateUser).toHaveBeenCalledWith('1', dto);
    });
  });

  describe('updateUserRole', () => {
    it('passe id et body au service et retourne le user', async () => {
      const dto = { role_id: 2 };
      const updated = { id: 1, role_id: 2 };
      usersServiceMock.updateUserRole.mockResolvedValue(updated);

      const result = await controller.updateUserRole('1', dto);

      expect(result).toEqual(updated);
      expect(usersServiceMock.updateUserRole).toHaveBeenCalledWith('1', dto);
    });
  });

  describe('deleteUser', () => {
    it('appelle le service avec l’id et retourne le user', async () => {
      const deleted = { id: 1, is_deleted: true };
      usersServiceMock.deleteUser.mockResolvedValue(deleted);

      const result = await controller.deleteUser('1');

      expect(result).toEqual(deleted);
      expect(usersServiceMock.deleteUser).toHaveBeenCalledWith('1');
    });
  });
});
