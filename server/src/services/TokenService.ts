import {decode, sign, verify} from "hono/jwt"
import {ECollection} from "../enums/Collection.enum";
import {ServiceFactory} from "./ServiceFactory";
import {JWTPayload} from "hono/dist/types/utils/jwt/types";
import {ELogServiceEvent} from "../enums/LogEvent.enum";
import {ITokenPayload, ITokenService} from "../interfaces/TokenService.interface";
import {IMongoService, MongoResponse} from "../interfaces/MongoService.interface";
import {ILogService} from "../interfaces/LogService.interface";
import {IUserDetails} from "../interfaces/AccountService.interface";
import process from "node:process";

const TokenServiceMessages = {
    INVALID_REFRESH_TOKEN: "Refresh token invalid.",
    ERROR_DELETE_REFRESH_TOKEN: "Error occurred while deleting refresh token.",
    SUCCESS_REVOKE_REFRESH_TOKEN: "Successfully revoked refresh token from database.",
    ERROR_LOCATE_REFRESH_TOKEN: "Error occurred while locating refresh token.",
    ERROR_LOCATE_USERID: "Error occurred while locating user id.",
    SUCCESS_INSERT_REFRESH_TOKEN: "Refresh token stored successfully.",
    ERROR_REFRESH_TOKEN_EXISTS: "Refresh token already exists, try again.",
    ERROR_UNKNOWN: "Unknown error occurred, try again later."
}

export class TokenService implements ITokenService{
    private _mongoService: IMongoService;
    private _logService: ILogService;

    constructor() {
        this._mongoService = ServiceFactory.createMongoService();
        this._logService = ServiceFactory.createLogService();
    }

    private getUserIDFromRefresh(refresh_token: string): string {
        const refreshPayload: JWTPayload = decode(refresh_token).payload;
        return refreshPayload["data"] as string;
    }

    private async verifyRefreshToken(refresh_token: string): Promise<boolean> {
        try {
            await verify(refresh_token, (process.env.REFRESH_TOKEN_SECRET as string));
            return true;
        } catch (error) {
            return false;
        }
    }

    async verifyAccessToken(access_token: string): Promise<boolean> {
        try {
            await verify(access_token, (process.env.ACCESS_TOKEN_SECRET as string));
            return true;
        } catch (error) {
            return false;
        }
    }

    async revokeRefreshToken(refresh_token: string): Promise<ITokenPayload> {
        if(!await this.verifyRefreshToken(refresh_token)) {
            return {
                response: this._mongoService.objResponse(false, TokenServiceMessages.INVALID_REFRESH_TOKEN),
                code: 401
            }
        }

        try {
            return await this._mongoService.handleConnection
            (async (): Promise<ITokenPayload> => {
                const query = { token: refresh_token };
                const response: MongoResponse = await this._mongoService.deleteOne(query, ECollection.tokens);
                if(!response["status"]) {
                    return {
                        response: this._mongoService.objResponse(false, TokenServiceMessages.ERROR_DELETE_REFRESH_TOKEN),
                        code: 500
                    }
                }

                const user_id: string = this.getUserIDFromRefresh(refresh_token);
                return {
                    response: this._mongoService.objResponse(true, TokenServiceMessages.SUCCESS_REVOKE_REFRESH_TOKEN),
                    code: 200,
                    user_id: user_id
                }
            })
        } catch (error) {
            return {
                response: this._mongoService.objResponse(false, TokenServiceMessages.INVALID_REFRESH_TOKEN),
                code: 401
            }
        }
    }

    async generateNewAuth(refresh_token: string): Promise<ITokenPayload> {
        if(!await this.verifyRefreshToken(refresh_token)) {
            return {
                response: this._mongoService.objResponse(false, TokenServiceMessages.INVALID_REFRESH_TOKEN),
                code: 401
            }
        }

        try {
            return await this._mongoService.handleConnection
            (async (): Promise<ITokenPayload> => {
                const refreshQuery = { token: refresh_token };
                let response: MongoResponse = await this._mongoService.findOne(refreshQuery, ECollection.tokens);
                if(!response["status"]) {
                    return {
                        response: this._mongoService.objResponse(false, TokenServiceMessages.ERROR_LOCATE_REFRESH_TOKEN),
                        code: 401
                    };
                }

                const user_id: string = this.getUserIDFromRefresh(refresh_token);
                const userQuery = { user_id: user_id };
                response = await this._mongoService.findOne(userQuery, ECollection.users);
                if(!response["status"]) {
                    return {
                        response: this._mongoService.objResponse(false, TokenServiceMessages.ERROR_LOCATE_USERID),
                        code: 401
                    };
                }

                const data: IUserDetails = response["result"];
                response = await this._mongoService.deleteOne(refreshQuery, ECollection.tokens);
                if(!response["status"]) {
                    return {
                        response: this._mongoService.objResponse(false, TokenServiceMessages.ERROR_DELETE_REFRESH_TOKEN),
                        code: 500
                    };
                }

                let returnPayload: ITokenPayload = await this.generateLoginTokens(data);
                returnPayload["code"] = 200;
                await this._logService.addLog({
                    timestamp: new Date(Date.now()),
                    event: ELogServiceEvent.REFRESH_TOKEN,
                    user_id: user_id
                });
                return returnPayload;
            })
        } catch (error) {
            return {
                response: this._mongoService.objResponse(false, TokenServiceMessages.INVALID_REFRESH_TOKEN),
                code: 401
            }
        }
    }

    async generateLoginTokens(data: IUserDetails): Promise<ITokenPayload> {
        const token: string = await sign({
            data: data,
            exp: Math.floor(Date.now() / 1000) + 60 * parseInt((process.env.ACCESS_TOKEN_EXPIRY as string))
        }, (process.env.ACCESS_TOKEN_SECRET as string));

        const refreshToken: string = await sign({
            data: data["user_id"],
            exp: Math.floor(Date.now() / 1000) + 60 * parseInt((process.env.REFRESH_TOKEN_EXPIRY as string))
        }, (process.env.REFRESH_TOKEN_SECRET as string));

        const response: MongoResponse = await this._mongoService.handleConnection
        (async (): Promise<MongoResponse> => {
            const locateQuery = { token: refreshToken };
            try {
                let data: MongoResponse =  await this._mongoService.findOne(locateQuery, ECollection.tokens);
                if(data["status"]) {
                    return this._mongoService.objResponse(false, TokenServiceMessages.ERROR_REFRESH_TOKEN_EXISTS);
                }

                await this._mongoService.handleTTLIndex();
                const expiresAt: Date = new Date(Date.now() + 15 * 60 * 1000);
                const insertData = {
                    token: refreshToken,
                    expiresAt: expiresAt
                }
                data = await this._mongoService.insertOne(insertData, ECollection.tokens);
                if(data["status"]) {
                    return this._mongoService.objResponse(true, TokenServiceMessages.SUCCESS_INSERT_REFRESH_TOKEN);
                }

                return this._mongoService.objResponse(false, TokenServiceMessages.ERROR_UNKNOWN);
            } catch (error) {
                return this._mongoService.objResponse(false, TokenServiceMessages.ERROR_UNKNOWN);
            }
        });

        return {
            access_token: token,
            refresh_token: refreshToken,
            response: response,
            user_id: data["user_id"]
        };
    }
}