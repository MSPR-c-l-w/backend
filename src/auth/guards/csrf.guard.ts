import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { CsrfService } from 'src/auth/services/csrf/csrf.service';
import type { JwtPayload } from 'src/auth/strategies/jwt.strategy';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly csrfService: CsrfService) {}

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'http') {
      return true;
    }

    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const method = req.method?.toUpperCase() ?? 'GET';

    // Méthodes sûres: pas de protection CSRF nécessaire.
    if (SAFE_METHODS.has(method)) {
      return true;
    }

    const auth = req.headers['authorization'];
    if (!auth || !auth.toString().startsWith('Bearer ')) {
      // On ne force le CSRF que pour les appels authentifiés par JWT.
      return true;
    }

    const user = req.user as JwtPayload | undefined;
    if (!user || typeof user.sub !== 'number') {
      // Si le JwtAuthGuard n'a pas encore injecté l'utilisateur, on ne peut pas vérifier le CSRF.
      return true;
    }

    const tokenHeader =
      (req.headers['x-csrf-token'] as string | undefined) ??
      (req.headers['x-xsrf-token'] as string | undefined);

    if (!tokenHeader) {
      throw new ForbiddenException('CSRF token manquant');
    }

    try {
      this.csrfService.verify(tokenHeader, user.sub);
      return true;
    } catch (error) {
      throw new ForbiddenException(
        error instanceof Error ? error.message : 'CSRF token invalide',
      );
    }
  }
}
