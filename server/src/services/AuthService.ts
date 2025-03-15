import {IMongoService, MongoResponse} from "./MongoService";
import {ServiceFactory} from "./ServiceFactory";
import {Collection} from "../enums/Collection.enum";
import {hash, compare} from "bcrypt-ts"
import {sign} from "hono/jwt"

export interface IAuthService {
    login(username: string, password: string): Promise<IAuthResponse>;
    signup(username: string, password: string): Promise<IAuthResponse>;
}

export interface IAuthResponse {
    status: boolean;
    message: string;
    token?: string;
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

    constructor() {
        this._mongoService = ServiceFactory.createMongoService();
    }

    private authResponse(status: boolean, message: string, token?: string): IAuthResponse {
        return token !== undefined ? { status, message, token } : { status, message };
    }

    async signup(username: string, password: string): Promise<IAuthResponse> {
        if(await this.getDetails(username)) {
            return this.authResponse(false, AuthServiceMessages.SIGNUP_EXISTS);
        }

        const data = {
            username: username,
            password: await hash(password, 10)
        }

        const response: MongoResponse = await this._mongoService.handleConnection
        (async (): Promise<object> => {
            return await this._mongoService.insertOne(data, Collection.users);
        })

        if(response["status"]) {
            return this.authResponse(true, AuthServiceMessages.SIGNUP_SUCCESS);
        }

        return this.authResponse(false, AuthServiceMessages.SIGNUP_FAILURE);
    }

    async login(username: string, password: string): Promise<IAuthResponse> {
        const data: IUserDetails | null = await this.getDetails(username);
        if(data === null || typeof data === null) {
            return this.authResponse(false, AuthServiceMessages.LOGIN_FAILURE);
        }

        const hashedPassword: string = data["password"];
        if(await compare(password, hashedPassword)) {
            const token = await sign({
                data: data,
                exp: Math.floor(Date.now() / 1000) + 60 * 5
            }, (process.env.ACCESS_TOKEN_SECRET as string))
            return this.authResponse(true, AuthServiceMessages.LOGIN_SUCCESS, token);
        } else {
            return this.authResponse(false, AuthServiceMessages.LOGIN_INCORRECT)
        }
    }

    private async getDetails(username: string): Promise<IUserDetails | null> {
        const response: MongoResponse = await this._mongoService.handleConnection
        (async (): Promise<object> => {
            const query = { username: username };
            return await this._mongoService.findOne(query, Collection.users);
        })

        if(response["status"]) {
            return response["result"];
        } else {
            return null;
        }
    }
}