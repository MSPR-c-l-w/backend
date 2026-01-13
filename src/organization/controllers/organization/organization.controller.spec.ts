import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationController } from './organization.controller';
import { SERVICES } from 'src/utils/constants';

describe('OrganizationController', () => {
  let controller: OrganizationController;
  const organizationServiceMock = {
    getOrganizations: jest.fn(),
    getOrganizationById: jest.fn(),
    createOrganization: jest.fn(),
    updateOrganization: jest.fn(),
    deleteOrganization: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationController],
      providers: [
        {
          provide: SERVICES.ORGANIZATIONS,
          useValue: organizationServiceMock,
        },
      ],
    }).compile();

    controller = module.get<OrganizationController>(OrganizationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
