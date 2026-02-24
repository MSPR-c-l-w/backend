/* eslint-disable prettier/prettier */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from 'src/auth/decorators/roles.decorator';
import { InsufficientRoleException } from 'src/auth/exceptions/insufficient-role.exception';
import { PrismaService } from 'src/prisma/services/prisma/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: { sub?: number };
    }>();
    const userId = request.user?.sub;

    if (!userId) {
      throw new UnauthorizedException('UNAUTHORIZED');
    }

    const prismaUser = this.prisma.user as unknown as {
      findUnique: (args: {
        where: { id: number };
        select: { role_id: true };
      }) => Promise<{ role_id: number | null } | null>;
    };

    const user = await prismaUser.findUnique({
      where: { id: userId },
      select: { role_id: true },
    });

    let currentRole: string | null = null;
    if (user?.role_id != null) {
      const role = await this.prisma.role.findUnique({
        where: { id: user.role_id },
        select: { name: true },
      });
      currentRole = role?.name ?? null;
    }

    if (!currentRole || !requiredRoles.includes(currentRole)) {
      throw new InsufficientRoleException(requiredRoles);
    }

    return true;
  }
}
