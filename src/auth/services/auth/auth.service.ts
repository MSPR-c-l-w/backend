import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';
import { hashPassword, verifyPassword } from 'src/utils/security/password';
import {
  generateResetToken,
  hashResetToken,
} from 'src/utils/security/reset-token';
import type { User } from 'src/utils/types';
import type { RegisterDto } from 'src/auth/dtos/register.dto';
import { MailerService } from 'src/auth/services/mailer/mailer.service';

function publicUserSelect() {
  return {
    id: true,
    organization_id: true,
    role_id: true,
    email: true,
    first_name: true,
    last_name: true,
    date_of_birth: true,
    gender: true,
    height: true,
    created_at: true,
    updated_at: true,
    deleted_at: true,
    is_active: true,
    is_deleted: true,
  } as const;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mailer: MailerService,
  ) {}

  private signAccessToken(user: { id: number; email: string }) {
    return this.jwt.signAsync({
      sub: user.id,
      email: user.email,
    });
  }

  private getRefreshTokenTtlMs() {
    const seconds = process.env.REFRESH_TOKEN_EXPIRES_IN
      ? parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN)
      : 60 * 60 * 24 * 7; // 7 jours
    return seconds * 1000;
  }

  private getVerifyEmailTtlMs() {
    const seconds = process.env.EMAIL_VERIFY_EXPIRES_IN
      ? parseInt(process.env.EMAIL_VERIFY_EXPIRES_IN)
      : 60 * 60 * 24; // 24h
    return seconds * 1000;
  }

  private async issueAndStoreRefreshToken(userId: number) {
    const refreshToken = generateResetToken();
    const refreshHash = hashResetToken(refreshToken);
    const expiresAt = new Date(Date.now() + this.getRefreshTokenTtlMs());

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        refresh_token_hash: refreshHash,
        refresh_token_expires_at: expiresAt,
      },
      select: { id: true },
    });

    return refreshToken;
  }

  private async rotateRefreshToken(refreshToken: string) {
    const refreshHash = hashResetToken(refreshToken);

    const user = await this.prisma.user.findUnique({
      where: { refresh_token_hash: refreshHash },
      select: {
        id: true,
        email: true,
        refresh_token_expires_at: true,
        is_active: true,
        is_deleted: true,
      },
    });

    if (
      !user ||
      user.is_deleted ||
      !user.is_active ||
      !user.refresh_token_expires_at ||
      user.refresh_token_expires_at.getTime() < Date.now()
    ) {
      throw new UnauthorizedException('INVALID_REFRESH_TOKEN');
    }

    const newRefreshToken = await this.issueAndStoreRefreshToken(user.id);
    const access_token = await this.signAccessToken({
      id: user.id,
      email: user.email,
    });
    return { access_token, refresh_token: newRefreshToken };
  }

  private async createAndSendEmailVerification(userId: number, email: string) {
    const token = generateResetToken();
    const tokenHash = hashResetToken(token);
    const expiresAt = new Date(Date.now() + this.getVerifyEmailTtlMs());

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        email_verification_token_hash: tokenHash,
        email_verification_token_expires_at: expiresAt,
      },
      select: { id: true },
    });

    await this.mailer.sendAccountVerificationEmail(email, token);

    if (process.env.NODE_ENV !== 'production') {
      return token;
    }
    return undefined;
  }

  async register(
    dto: RegisterDto,
  ): Promise<{ message: string; token?: string }> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException('EMAIL_ALREADY_USED');
    }

    const passwordHash = await hashPassword(dto.password);

    const created = await this.prisma.user.create({
      data: {
        ...(dto.organization_id == null
          ? {}
          : { organization: { connect: { id: dto.organization_id } } }),
        email: dto.email,
        password_hash: passwordHash,
        first_name: dto.first_name,
        last_name: dto.last_name,
        date_of_birth: dto.date_of_birth
          ? new Date(dto.date_of_birth)
          : undefined,
        gender: dto.gender,
        height: dto.height,
        is_active: false,
        is_deleted: false,
      },
      select: { id: true, email: true },
    });

    const token = await this.createAndSendEmailVerification(
      created.id,
      created.email,
    );
    return { message: 'ACCOUNT_CREATED_VERIFICATION_EMAIL_SENT', token };
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password_hash: true,
        is_active: true,
        is_deleted: true,
      },
    });

    if (!user || user.is_deleted || !user.is_active) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    const access_token = await this.signAccessToken({
      id: user.id,
      email: user.email,
    });
    const refresh_token = await this.issueAndStoreRefreshToken(user.id);
    return { access_token, refresh_token };
  }

  async getProfile(userId: number): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...publicUserSelect(),
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
            branding_config: true,
            created_at: true,
            updated_at: true,
            deleted_at: true,
            is_active: true,
            is_deleted: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('USER_NOT_FOUND');
    }

    return user as User;
  }

  async requestPasswordReset(
    email: string,
  ): Promise<{ message: string; token?: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, is_active: true, is_deleted: true },
    });

    if (!user || user.is_deleted || !user.is_active) {
      return { message: 'IF_ACCOUNT_EXISTS_RESET_EMAIL_SENT' };
    }

    const token = generateResetToken();
    const tokenHash = hashResetToken(token);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        reset_password_token_hash: tokenHash,
        reset_password_token_expires_at: expiresAt,
      },
      select: { id: true },
    });

    await this.mailer.sendPasswordResetEmail(email, token);

    if (process.env.NODE_ENV !== 'production') {
      return { message: 'IF_ACCOUNT_EXISTS_RESET_EMAIL_SENT', token };
    }

    return { message: 'IF_ACCOUNT_EXISTS_RESET_EMAIL_SENT' };
  }

  async confirmPasswordReset(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const tokenHash = hashResetToken(token);

    const user = await this.prisma.user.findUnique({
      where: { reset_password_token_hash: tokenHash },
      select: {
        id: true,
        reset_password_token_expires_at: true,
        is_active: true,
        is_deleted: true,
      },
    });

    if (
      !user ||
      user.is_deleted ||
      !user.is_active ||
      !user.reset_password_token_expires_at ||
      user.reset_password_token_expires_at.getTime() < Date.now()
    ) {
      throw new BadRequestException('INVALID_OR_EXPIRED_TOKEN');
    }

    const passwordHash = await hashPassword(newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: passwordHash,
        reset_password_token_hash: null,
        reset_password_token_expires_at: null,
      },
      select: { id: true },
    });

    return { message: 'PASSWORD_RESET_OK' };
  }

  async refresh(refreshToken: string) {
    return this.rotateRefreshToken(refreshToken);
  }

  async logout(refreshToken: string): Promise<{ message: string }> {
    const refreshHash = hashResetToken(refreshToken);

    const user = await this.prisma.user.findUnique({
      where: { refresh_token_hash: refreshHash },
      select: { id: true },
    });

    if (user) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          refresh_token_hash: null,
          refresh_token_expires_at: null,
        },
        select: { id: true },
      });
    }

    return { message: 'LOGOUT_OK' };
  }

  async requestAccountVerification(
    email: string,
  ): Promise<{ message: string; token?: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        is_active: true,
        is_deleted: true,
        email_verified_at: true,
      },
    });

    if (!user || user.is_deleted || user.email_verified_at) {
      return { message: 'IF_ACCOUNT_EXISTS_VERIFICATION_EMAIL_SENT' };
    }

    const token = await this.createAndSendEmailVerification(user.id, email);
    return { message: 'IF_ACCOUNT_EXISTS_VERIFICATION_EMAIL_SENT', token };
  }

  async confirmAccountVerification(
    token: string,
  ): Promise<{ message: string }> {
    const tokenHash = hashResetToken(token);

    const user = await this.prisma.user.findUnique({
      where: { email_verification_token_hash: tokenHash },
      select: {
        id: true,
        email_verification_token_expires_at: true,
        is_deleted: true,
      },
    });

    if (
      !user ||
      user.is_deleted ||
      !user.email_verification_token_expires_at ||
      user.email_verification_token_expires_at.getTime() < Date.now()
    ) {
      throw new BadRequestException('INVALID_OR_EXPIRED_TOKEN');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        is_active: true,
        email_verified_at: new Date(),
        email_verification_token_hash: null,
        email_verification_token_expires_at: null,
      },
      select: { id: true },
    });

    return { message: 'ACCOUNT_VERIFIED_OK' };
  }
}
