import {ITokenPayload} from "../services/TokenService";
import {ContentfulStatusCode} from "hono/dist/types/utils/http-status";

export interface IAuthService {
    login(username: string, password: string): Promise<IAuthResponse>;
    signup(username: string, password: string, email: string): Promise<IAuthResponse>;
    logout(data: ITokenPayload): Promise<IAuthResponse>;
}

export interface IAuthResponse {
    status: boolean;
    message: string;
    code: ContentfulStatusCode;
    token?: ITokenPayload;
}