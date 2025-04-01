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
    private _authStatus: boolean;

    private constructor() {
        this._fetchService = ServiceFactory.createFetchService();
        this._authStatus = false;
    }

    static getInstance(): AuthService {
        if (this._instance === null) {
            this._instance = new AuthService();
        }

        return this._instance;
    }

    get authStatus(): boolean {
        return this._authStatus;
    }

    set authStatus(value: boolean) {
        this._authStatus = value;
    }

    async authenticate(username: string, password: string): Promise<AuthResponse> {
        const request: LoginRequest = {
            username: username,
            password: password
        }

        const response: AuthResponse = await this._fetchService.request(EFetchMethod.POST, "/auth/login", JSON.parse(JSON.stringify(request))) as AuthResponse;
        this._authStatus = response["status"];
        return response;
    }

    async logout(): Promise<AuthResponse> {
        const response: AuthResponse = await this._fetchService.request(EFetchMethod.POST, "/auth/logout") as AuthResponse;
        this._authStatus = false;
        return response;
    }

    /*async refreshAuthentication(): Promise<void> {
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
    }*/
}