import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from 'src/auth/services/mailer/mailer.service';
import * as passwordUtils from 'src/utils/security/password';

jest.mock('src/utils/security/password', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed-password'),
  verifyPassword: jest.fn(),
}));

jest.mock('src/utils/security/reset-token', () => ({
  generateResetToken: jest.fn().mockReturnValue('plain-token'),
  hashResetToken: jest.fn().mockReturnValue('hashed-token'),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: Record<string, Record<string, jest.Mock>>;
  let jwtService: { signAsync: jest.Mock };
  let mailer: {
    sendAccountVerificationEmail: jest.Mock;
    sendPasswordResetEmail: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      role: {
        findFirst: jest.fn(),
      },
    };

    jwtService = { signAsync: jest.fn().mockResolvedValue('jwt-access-token') };
    mailer = {
      sendAccountVerificationEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,

        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: MailerService, useValue: mailer },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── register ────────────────────────────────────────────────────────────

  describe('register', () => {
    const dto = {
      email: 'new@test.com',
      password: 'password123',
      first_name: 'Jean',
      last_name: 'Dupont',
    };

    it('crée le compte et retourne un message de confirmation', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 1, email: dto.email });
      prisma.user.update.mockResolvedValue({ id: 1 });

      const result = await service.register(dto);

      expect(result.message).toBe('ACCOUNT_CREATED_VERIFICATION_EMAIL_SENT');
      expect(mailer.sendAccountVerificationEmail).toHaveBeenCalledWith(
        dto.email,
        'plain-token',
      );
    });

    it('lève BadRequestException si email déjà utilisé', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1 });

      await expect(service.register(dto)).rejects.toThrow(BadRequestException);
      await expect(service.register(dto)).rejects.toThrow('EMAIL_ALREADY_USED');
    });

    it('retourne le token en mode non-production', async () => {
      const original = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 1, email: dto.email });
      prisma.user.update.mockResolvedValue({ id: 1 });

      const result = await service.register(dto);
      expect(result.token).toBe('plain-token');

      process.env.NODE_ENV = original;
    });

    it('ne retourne pas le token en production', async () => {
      const original = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 1, email: dto.email });
      prisma.user.update.mockResolvedValue({ id: 1 });

      const result = await service.register(dto);
      expect(result.token).toBeUndefined();

      process.env.NODE_ENV = original;
    });
  });

  // ─── login ────────────────────────────────────────────────────────────────

  describe('login', () => {
    const activeUser = {
      id: 1,
      email: 'test@test.com',
      password_hash: 'hash',
      is_active: true,
      is_deleted: false,
    };

    it('retourne access_token et refresh_token si credentials valides', async () => {
      prisma.user.findUnique.mockResolvedValue(activeUser);
      (passwordUtils.verifyPassword as jest.Mock).mockResolvedValue(true);
      prisma.user.update.mockResolvedValue({ id: 1 });

      const result = await service.login('test@test.com', 'password123');

      expect(result).toHaveProperty('access_token', 'jwt-access-token');
      expect(result).toHaveProperty('refresh_token', 'plain-token');
    });

    it("lève UnauthorizedException si l'email est inconnu", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login('unknown@test.com', 'pass')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('lève UnauthorizedException si le mot de passe est incorrect', async () => {
      prisma.user.findUnique.mockResolvedValue(activeUser);
      (passwordUtils.verifyPassword as jest.Mock).mockResolvedValue(false);

      await expect(service.login('test@test.com', 'wrong')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('lève UnauthorizedException si le compte est inactif', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...activeUser,
        is_active: false,
      });

      await expect(service.login('test@test.com', 'pass')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('lève UnauthorizedException si le compte est supprimé', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...activeUser,
        is_deleted: true,
      });

      await expect(service.login('test@test.com', 'pass')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ─── refresh ──────────────────────────────────────────────────────────────

  describe('refresh', () => {
    it('retourne de nouveaux tokens si le refresh token est valide', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'test@test.com',
        refresh_token_expires_at: new Date(Date.now() + 100_000),
        is_active: true,
        is_deleted: false,
      });
      prisma.user.update.mockResolvedValue({ id: 1 });

      const result = await service.refresh('valid-refresh-token');

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
    });

    it('lève UnauthorizedException si le refresh token est invalide', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.refresh('bad-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('lève UnauthorizedException si le refresh token est expiré', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'test@test.com',
        refresh_token_expires_at: new Date(Date.now() - 1000),
        is_active: true,
        is_deleted: false,
      });

      await expect(service.refresh('expired-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ─── logout ───────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('révoque le refresh token et retourne LOGOUT_OK', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1 });
      prisma.user.update.mockResolvedValue({ id: 1 });

      const result = await service.logout('valid-refresh-token');

      expect(result).toEqual({ message: 'LOGOUT_OK' });
      expect(prisma.user.update).toHaveBeenCalled();
    });

    it("retourne LOGOUT_OK même si le token n'existe pas (déjà révoqué)", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.logout('already-revoked');

      expect(result).toEqual({ message: 'LOGOUT_OK' });
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  // ─── requestPasswordReset ─────────────────────────────────────────────────

  describe('requestPasswordReset', () => {
    it("génère un token, envoie l'email et retourne la réponse générique", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        is_active: true,
        is_deleted: false,
      });
      prisma.user.update.mockResolvedValue({ id: 1 });

      const result = await service.requestPasswordReset('user@test.com');

      expect(result.message).toBe('IF_ACCOUNT_EXISTS_RESET_EMAIL_SENT');
      expect(mailer.sendPasswordResetEmail).toHaveBeenCalledWith(
        'user@test.com',
        'plain-token',
      );
    });

    it("retourne la réponse générique sans envoyer d'email si l'email n'existe pas", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.requestPasswordReset('unknown@test.com');

      expect(result.message).toBe('IF_ACCOUNT_EXISTS_RESET_EMAIL_SENT');
      expect(mailer.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it("retourne la réponse générique sans envoyer d'email si le compte est inactif", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        is_active: false,
        is_deleted: false,
      });

      const result = await service.requestPasswordReset('inactive@test.com');

      expect(result.message).toBe('IF_ACCOUNT_EXISTS_RESET_EMAIL_SENT');
      expect(mailer.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('retourne le token en mode non-production', async () => {
      const original = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        is_active: true,
        is_deleted: false,
      });
      prisma.user.update.mockResolvedValue({ id: 1 });

      const result = await service.requestPasswordReset('user@test.com');
      expect(result.token).toBe('plain-token');

      process.env.NODE_ENV = original;
    });

    it('ne retourne pas le token en production', async () => {
      const original = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        is_active: true,
        is_deleted: false,
      });
      prisma.user.update.mockResolvedValue({ id: 1 });

      const result = await service.requestPasswordReset('user@test.com');
      expect(result.token).toBeUndefined();

      process.env.NODE_ENV = original;
    });
  });

  // ─── confirmPasswordReset ─────────────────────────────────────────────────

  describe('confirmPasswordReset', () => {
    const validUser = {
      id: 1,
      reset_password_token_expires_at: new Date(Date.now() + 100_000),
      is_active: true,
      is_deleted: false,
    };

    it('réinitialise le mot de passe et retourne PASSWORD_RESET_OK', async () => {
      prisma.user.findUnique.mockResolvedValue(validUser);
      prisma.user.update.mockResolvedValue({ id: 1 });

      const result = await service.confirmPasswordReset(
        'valid-token',
        'newpassword123',
      );

      expect(result).toEqual({ message: 'PASSWORD_RESET_OK' });
      expect(passwordUtils.hashPassword).toHaveBeenCalledWith('newpassword123');

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({
            reset_password_token_hash: null,
            reset_password_token_expires_at: null,
          }),
        }),
      );
    });

    it('lève BadRequestException si le token est invalide', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.confirmPasswordReset('bad-token', 'newpass'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.confirmPasswordReset('bad-token', 'newpass'),
      ).rejects.toThrow('INVALID_OR_EXPIRED_TOKEN');
    });

    it('lève BadRequestException si le token est expiré', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...validUser,
        reset_password_token_expires_at: new Date(Date.now() - 1000),
      });

      await expect(
        service.confirmPasswordReset('expired-token', 'newpass'),
      ).rejects.toThrow(BadRequestException);
    });

    it('lève BadRequestException si le compte est supprimé', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...validUser,
        is_deleted: true,
      });

      await expect(
        service.confirmPasswordReset('token', 'newpass'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── confirmAccountVerification ───────────────────────────────────────────

  describe('confirmAccountVerification', () => {
    it('active le compte et retourne ACCOUNT_VERIFIED_OK', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email_verification_token_expires_at: new Date(Date.now() + 100_000),
        is_deleted: false,
      });
      prisma.user.update.mockResolvedValue({ id: 1 });

      const result = await service.confirmAccountVerification('valid-token');

      expect(result).toEqual({ message: 'ACCOUNT_VERIFIED_OK' });

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({ is_active: true }),
        }),
      );
    });

    it('lève BadRequestException si le token est invalide', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.confirmAccountVerification('bad-token'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.confirmAccountVerification('bad-token'),
      ).rejects.toThrow('INVALID_OR_EXPIRED_TOKEN');
    });
  });
});
