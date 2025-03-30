import {IAuthService} from "../../interfaces/AuthService.interface.js";
import {createSignal, Signal} from "solid-js";
import {IFetchService} from "../../interfaces/FetchService.interface.ts";
import {ServiceFactory} from "../ServiceFactory.ts";
import {EFetchMethod} from "../../enums/FetchMethod.enum.ts";
import {LoginRequest} from "@shared/types/AuthRequest.types.ts";
import {GenericResponse} from "@shared/types/GenericResponse.types.ts";
import {AuthResponse} from "@shared/types/AuthResponse.types.ts";
import {TokenPayload} from "@shared/types/TokenPayload.types.ts";

export class AuthService implements IAuthService {
    private static _instance: AuthService | null = null;
    private _authStatus: Signal<boolean> = createSignal(false);
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

    get AuthStatus(): () => boolean{
        return this._authStatus[0];
    }

    set AuthStatus(value: boolean) {
        this._authStatus[1](value);
    }

    async authenticate(username: string, password: string): Promise<AuthResponse> {
        const test: LoginRequest = {
            username: username,
            password: password
        }

        const response: AuthResponse = await this._fetchService.request(EFetchMethod.POST, "/auth/login", JSON.parse(JSON.stringify(test))) as AuthResponse;
        console.log(`test ${JSON.stringify(response)}`)
        if(response["status"]) {
            this._authStatus[1](true);
        }
        return response;
    }

    async refreshAuthentication(): Promise<void> {
        const refresh_token: string | null = localStorage.getItem("refresh_token");
        if(refresh_token === null) {
            this._authStatus[1](false);
        } else {
            const refreshBody: TokenPayload = {
                refresh_token: refresh_token
            };

            const response: TokenPayload | GenericResponse = await this._fetchService.request(EFetchMethod.POST, "/auth/refresh", JSON.parse(JSON.stringify(refreshBody)));
            if(response["code"] === 200) {
                let data: TokenPayload = response as TokenPayload;
                localStorage.setItem("access_token", data["access_token"] as string);
                localStorage.setItem("refresh_token", data["refresh_token"] as string);
            } else {
                this._authStatus[1](false);
            }

        }
    }
}