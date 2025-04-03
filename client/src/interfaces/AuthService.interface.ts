import {AuthResponse} from "@shared/types/AuthResponse.types.ts";

export interface IAuthService {
    getAuthStatus(): Promise<AuthResponse>
    authenticate(username: string, password: string): Promise<AuthResponse>;
    logout(): Promise<AuthResponse>;
}