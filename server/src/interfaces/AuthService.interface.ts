import {ContentfulStatusCode} from "hono/dist/types/utils/http-status";
import {ITokenPayload} from "./TokenService.interface";

export interface IAuthService {
    authResponse(status: boolean, message: string, code: ContentfulStatusCode, token?: ITokenPayload): IAuthResponse;
    login(username: string, password: string): Promise<IAuthResponse>;
    signup(username: string, password: string, email: string): Promise<IAuthResponse>;
    logout(refresh_token: string): Promise<IAuthResponse>;
}

export interface IAuthResponse {
    status: boolean;
    message: string;
    code: ContentfulStatusCode;
    token?: ITokenPayload;
}