import {AuthResponse} from "@shared/types/AuthResponse.types.ts";

export interface IAuthService {
    getAppAuthStatus(): boolean;
    authenticate(username: string, password: string): Promise<AuthResponse>;
    refreshAuthentication(): Promise<void>;
}