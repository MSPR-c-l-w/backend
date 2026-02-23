/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { RoleController } from './role.controller';
import { SERVICES } from 'src/utils/constants';

describe('RoleController', () => {
  let controller: RoleController;
  const roleServiceMock = {
    getRoles: jest.fn(),
    getRoleById: jest.fn(),
    createRole: jest.fn(),
    updateRole: jest.fn(),
    deleteRole: jest.fn(),
  };

  const mockRole: Role = {
    id: 1,
    name: 'admin',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoleController],
      providers: [
        {
          provide: SERVICES.ROLE,
          useValue: roleServiceMock,
        },
      ],
    }).compile();

    controller = module.get<RoleController>(RoleController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getRoles appelle le service', async () => {
    roleServiceMock.getRoles.mockResolvedValue([mockRole]);
    await expect(controller.getRoles()).resolves.toEqual([mockRole]);
    expect(roleServiceMock.getRoles).toHaveBeenCalledTimes(1);
  });

  it('getRoleById appelle le service', async () => {
    roleServiceMock.getRoleById.mockResolvedValue(mockRole);
    await expect(controller.getRoleById('1')).resolves.toEqual(mockRole);
    expect(roleServiceMock.getRoleById).toHaveBeenCalledWith('1');
  });

  it('createRole appelle le service', async () => {
    roleServiceMock.createRole.mockResolvedValue(mockRole);
    await expect(controller.createRole({ name: 'admin' })).resolves.toEqual(
      mockRole,
    );
    expect(roleServiceMock.createRole).toHaveBeenCalledWith({ name: 'admin' });
  });

  it('updateRole appelle le service', async () => {
    roleServiceMock.updateRole.mockResolvedValue({
      ...mockRole,
      name: 'coach',
    });
    await expect(
      controller.updateRole('1', { name: 'coach' }),
    ).resolves.toEqual({
      ...mockRole,
      name: 'coach',
    });
    expect(roleServiceMock.updateRole).toHaveBeenCalledWith('1', {
      name: 'coach',
    });
  });

  it('deleteRole appelle le service', async () => {
    roleServiceMock.deleteRole.mockResolvedValue(mockRole);
    await expect(controller.deleteRole('1')).resolves.toEqual(mockRole);
    expect(roleServiceMock.deleteRole).toHaveBeenCalledWith('1');
  });
});
