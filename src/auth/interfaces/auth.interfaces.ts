export interface IAuthController {
    login(email: string, password: string): Promise<string>;
    register(email: string, password: string): Promise<string>;
    logout(): Promise<void>;
    refreshToken(token: string): Promise<string>;
    verifyToken(token: string): Promise<boolean>;
}

export interface IAuthService {
    login(email: string, password: string): Promise<string>;
    register(email: string, password: string): Promise<string>;
    logout(): Promise<void>;
    refreshToken(token: string): Promise<string>;
    verifyToken(token: string): Promise<boolean>;
}