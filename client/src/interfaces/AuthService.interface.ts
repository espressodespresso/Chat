import {AuthResponse} from "@shared/types/AuthResponse.types.ts";

export interface IAuthService {
    get authStatus(): boolean;
    set authStatus(value: boolean);
    authenticate(username: string, password: string): Promise<AuthResponse>;
    logout(): Promise<AuthResponse>;
}