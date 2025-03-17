import {IMongoService, MongoResponse} from "./MongoService";
import {ServiceFactory} from "./ServiceFactory";
import {ECollection} from "../enums/Collection.enum";
import {hash, compare} from "bcrypt-ts"
import {sign} from "hono/jwt"
import {ContentfulStatusCode} from "hono/dist/types/utils/http-status";
import {ITokenPayload, ITokenService} from "./TokenService";

export interface IAuthService {
    login(username: string, password: string): Promise<IAuthResponse>;
    signup(username: string, password: string): Promise<IAuthResponse>;
}

export interface IAuthResponse {
    status: boolean;
    message: string;
    code: ContentfulStatusCode;
    token?: ITokenPayload;
}

export interface IUserDetails {
    username: string;
    password: string;
}

const AuthServiceMessages = {
    SIGNUP_EXISTS: "User already exists.",
    SIGNUP_SUCCESS: "User created successfully.",
    SIGNUP_FAILURE: "Unknown error occurred.",
    LOGIN_FAILURE: "User with credentials doesn't exist.",
    LOGIN_SUCCESS: "User logged in successfully.",
    LOGIN_INCORRECT: "Incorrect password."
}

export class AuthService implements IAuthService {
    private _mongoService: IMongoService;
    private _tokenService: ITokenService;

    constructor() {
        this._mongoService = ServiceFactory.createMongoService();
        this._tokenService = ServiceFactory.createTokenService();
    }

    private authResponse(status: boolean, message: string, code: ContentfulStatusCode, token?: ITokenPayload): IAuthResponse {
        return token !== undefined ? { status, message, code, token } : { status, message, code };
    }

    async signup(username: string, password: string): Promise<IAuthResponse> {
        if(await this.getDetails(username)) {
            return this.authResponse(false, AuthServiceMessages.SIGNUP_EXISTS, 409);
        }

        const data = {
            username: username,
            password: await hash(password, 10)
        }

        const response: MongoResponse = await this._mongoService.handleConnection
        (async (): Promise<MongoResponse> => {
            return await this._mongoService.insertOne(data, ECollection.users);
        })

        if(response["status"]) {
            return this.authResponse(true, AuthServiceMessages.SIGNUP_SUCCESS, 200);
        }

        return this.authResponse(false, AuthServiceMessages.SIGNUP_FAILURE, 401);
    }

    async login(username: string, password: string): Promise<IAuthResponse> {
        const data: IUserDetails | null = await this.getDetails(username);
        if(data === null || typeof data === null) {
            return this.authResponse(false, AuthServiceMessages.LOGIN_FAILURE, 401);
        }

        const hashedPassword: string = data["password"];
        if(await compare(password, hashedPassword)) {
            return this.authResponse(true, AuthServiceMessages.LOGIN_SUCCESS, 200, await this._tokenService.generateLoginTokens(data));
        } else {
            return this.authResponse(false, AuthServiceMessages.LOGIN_INCORRECT, 401)
        }
    }

    async getDetails(username: string): Promise<IUserDetails | null> {
        const response: MongoResponse = await this._mongoService.handleConnection
        (async (): Promise<MongoResponse> => {
            const query = { username: username };
            return await this._mongoService.findOne(query, ECollection.users);
        })

        if(response["status"]) {
            return response["result"];
        } else {
            return null;
        }
    }
}