import {IFetchService} from "../interfaces/FetchService.interface.js";
import {GenericResponse} from "@shared/types/GenericResponse.types.ts";
import {EFetchMethod} from "../enums/FetchMethod.enum.ts";
import {AuthResponse} from "@shared/types/AuthResponse.types.ts";
import {IAuthService} from "../interfaces/AuthService.interface.ts";
import {authServiceInstance} from "./singleton/AuthModule.ts";
import {TokenPayload} from "@shared/types/TokenPayload.types.ts";

export class FetchService implements IFetchService {
    private _authService: IAuthService = null as any;

    constructor() {
        setTimeout(() => {
            this._authService = authServiceInstance;
        }, 0);
    }

    async request(fetchMethod: EFetchMethod, route: string, body?: JSON, json?: boolean): Promise<GenericResponse | AuthResponse> {
        const fetchOptions: RequestInit = {
            method: fetchMethod,
            headers: {"Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("access_token")}`},
        }

        if(fetchMethod !== "GET" && body) {
            fetchOptions["body"] = JSON.stringify(body);
        }

        const response: Response = await fetch(`${import.meta.env.VITE_API_ADDRESS}${route}`, fetchOptions);
        if(response["status"] === 401 && response["headers"]["get"]("Content-Type") !== "application/json") {
            await this._authService.refreshAuthentication();
        }

        return response.json();
    }
}