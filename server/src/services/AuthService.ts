import {IMongoService, MongoResponse} from "./MongoService";
import {ServiceFactory} from "./ServiceFactory";
import {ECollection} from "../enums/Collection.enum";
import {compare, hash} from "bcrypt-ts"
import {ContentfulStatusCode} from "hono/dist/types/utils/http-status";
import {ITokenPayload, ITokenService} from "./TokenService";
import {ILogService} from "./LogService";
import {ELogServiceEvent} from "../enums/LogEvent.enum";
import {IAccountService, IUserDetails} from "./AccountService";
import {IGenericResponse} from "../utility/General.utility";

export interface IAuthService {
    login(username: string, password: string): Promise<IAuthResponse>;
    signup(username: string, password: string, email: string): Promise<IAuthResponse>;
}

export interface IAuthResponse {
    status: boolean;
    message: string;
    code: ContentfulStatusCode;
    token?: ITokenPayload;
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
    private _logService: ILogService;
    private _accountService: IAccountService;

    constructor() {
        this._mongoService = ServiceFactory.createMongoService();
        this._tokenService = ServiceFactory.createTokenService();
        this._logService = ServiceFactory.createLogService();
        this._accountService = ServiceFactory.createAccountService();
    }

    private authResponse(status: boolean, message: string, code: ContentfulStatusCode, token?: ITokenPayload): IAuthResponse {
        return token !== undefined ? { status, message, code, token } : { status, message, code };
    }

    async signup(username: string, password: string, email: string): Promise<IAuthResponse> {
        const accountResponse: IGenericResponse = await this._accountService.createAccount(username, password, email);
        const message: string = accountResponse["result"] as string;
        const code: ContentfulStatusCode = accountResponse["code"] as ContentfulStatusCode;
        return this.authResponse(accountResponse["status"], message, code);
    }

    async login(username: string, password: string): Promise<IAuthResponse> {
        const accountResponse: IGenericResponse = await this._accountService.getAccountDetails(username);
        if(!accountResponse["result"]) {
            return this.authResponse(false, AuthServiceMessages.LOGIN_FAILURE, 401);
        }

        const data: IUserDetails = accountResponse["result"] as IUserDetails;

        const hashedPassword: string = data["password"];
        if(await compare(password, hashedPassword)) {
            await this._logService.addLog({
                timestamp: new Date(Date.now()),
                event: ELogServiceEvent.USER_LOGIN,
                username: username
            });

            return this.authResponse(true, AuthServiceMessages.LOGIN_SUCCESS, 200, await this._tokenService.generateLoginTokens(data));
        } else {
            return this.authResponse(false, AuthServiceMessages.LOGIN_INCORRECT, 401)
        }
    }
}