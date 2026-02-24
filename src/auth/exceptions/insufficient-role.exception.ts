/* eslint-disable prettier/prettier */
import { ForbiddenException } from '@nestjs/common';

export class InsufficientRoleException extends ForbiddenException {
  constructor(requiredRoles: string[]) {
    if (requiredRoles.length === 1 && requiredRoles[0] === 'ADMIN') {
      super('YOU_MUST_BE_AN_ADMINISTRATOR');
      return;
    }
    super(`YOU_MUST_BE_AN_${requiredRoles.join('|').toUpperCase()}`);
  }
}
