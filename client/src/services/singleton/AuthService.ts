import {IAuthService} from "../../interfaces/AuthService.interface.js";
import {IFetchService} from "../../interfaces/FetchService.interface.ts";
import {ServiceFactory} from "../ServiceFactory.ts";
import {EFetchMethod} from "../../enums/FetchMethod.enum.ts";
import {LoginRequest} from "@shared/types/AuthRequest.types.ts";
import {GenericResponse} from "@shared/types/GenericResponse.types.ts";
import {AuthResponse} from "@shared/types/AuthResponse.types.ts";
import {TokenPayload} from "@shared/types/TokenPayload.types.ts";

export class AuthService implements IAuthService {
    private static _instance: AuthService | null = null;
    private _fetchService: IFetchService;

    private constructor() {
        this._fetchService = ServiceFactory.createFetchService();
    }

    static getInstance(): AuthService {
        if (this._instance === null) {
            this._instance = new AuthService();
        }

        return this._instance;
    }

    getAppAuthStatus(): boolean {
        return this.getTokens() !== null;
    }

    async authenticate(username: string, password: string): Promise<AuthResponse> {
        const test: LoginRequest = {
            username: username,
            password: password
        }

        const response: AuthResponse = await this._fetchService.request(EFetchMethod.POST, "/auth/login", JSON.parse(JSON.stringify(test))) as AuthResponse;
        if(response["status"]) {
            let data: TokenPayload = response["token"] as TokenPayload;
            this.saveTokens(data);
        }
        return response;
    }

    async refreshAuthentication(): Promise<void> {
        const refresh_token: string | null = sessionStorage.getItem("refresh_token");
        if(refresh_token === null) {
            this.deleteTokens();
        } else {
            const refreshBody: TokenPayload = {
                refresh_token: refresh_token
            };

            const response: TokenPayload | GenericResponse = await this._fetchService.request(EFetchMethod.POST, "/auth/refresh", JSON.parse(JSON.stringify(refreshBody)));
            if(response["code"] === 200) {
                let data: TokenPayload = response as TokenPayload;
                this.saveTokens(data);
            } else {
                this.deleteTokens();
            }

        }
    }

    private saveTokens(payload: TokenPayload): void {
        sessionStorage.setItem("access_token", payload["access_token"] as string);
        sessionStorage.setItem("refresh_token", payload["refresh_token"] as string);
    }

    private deleteTokens(): void {
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("refresh_token");
    }

    private getTokens(): TokenPayload | null {
        const access_token: string | null = sessionStorage.getItem("access_token");
        const refresh_token: string | null = sessionStorage.getItem("refresh_token");
        if (access_token === null || refresh_token === null) {
            this.deleteTokens();
            return null;
        }

        return {
            access_token: access_token,
            refresh_token: refresh_token
        };
    }
}