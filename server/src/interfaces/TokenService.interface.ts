import {ContentfulStatusCode} from "hono/dist/types/utils/http-status";
import {IUserDetails} from "./AccountService.interface";
import {MongoResponse} from "./MongoService.interface";

export interface ITokenService {
    generateLoginTokens(data: IUserDetails): Promise<ITokenPayload>;
    generateNewAuth(refresh_token: string): Promise<ITokenPayload>;
    revokeRefreshToken(refresh_token: string): Promise<ITokenPayload>;
    verifyAccessToken(access_token: string): Promise<boolean>;
}

export interface ITokenPayload {
    access_token?: string
    refresh_token?: string;
    response?: MongoResponse;
    code?: ContentfulStatusCode;
    user_id?: string;
}