import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { InsufficientRoleException } from 'src/auth/exceptions/insufficient-role.exception';

@Catch(InsufficientRoleException)
export class InsufficientRoleExceptionFilter implements ExceptionFilter {
  catch(exception: InsufficientRoleException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<{
      status: (code: number) => {
        json: (payload: {
          statusCode: number;
          error: string;
          message: string;
        }) => void;
      };
    }>();

    response.status(HttpStatus.FORBIDDEN).json({
      statusCode: HttpStatus.FORBIDDEN,
      error: 'FORBIDDEN',
      message: exception.message,
    });
  }
}
