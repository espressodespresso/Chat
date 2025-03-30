import {AuthResponse} from "@shared/types/AuthResponse.types.ts";

export interface IAuthService {
    get AuthStatus(): () => boolean;
    set AuthStatus(value: boolean);
    authenticate(username: string, password: string): Promise<AuthResponse>;
    refreshAuthentication(): Promise<void>;
}