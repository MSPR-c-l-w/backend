import { Controller } from '@nestjs/common';
import { IAuthController } from 'src/auth/interfaces/auth.interfaces';
import { ROUTES } from 'src/utils/constants';



@Controller(ROUTES.AUTH)
export class AuthController implements IAuthController {
    login(email: string, password: string): Promise<string> {
        throw new Error('Method not implemented.');
    }
    register(email: string, password: string): Promise<string> {
        throw new Error('Method not implemented.');
    }
    logout(): Promise<void> {
        throw new Error('Method not implemented.');
    }
    refreshToken(token: string): Promise<string> {
        throw new Error('Method not implemented.');
    }
    verifyToken(token: string): Promise<boolean> {
        throw new Error('Method not implemented.');
    }
}
