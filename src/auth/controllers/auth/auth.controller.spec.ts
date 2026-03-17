import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { SERVICES } from 'src/utils/constants';
import { CsrfService } from 'src/auth/services/csrf/csrf.service';

describe('AuthController', () => {
  let controller: AuthController;
  const authServiceMock = {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    requestAccountVerification: jest.fn(),
    confirmAccountVerification: jest.fn(),
    requestPasswordReset: jest.fn(),
    confirmPasswordReset: jest.fn(),
    getProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: SERVICES.AUTH,
          useValue: authServiceMock,
        },
        CsrfService,
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
