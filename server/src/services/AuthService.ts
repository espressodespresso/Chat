import {ServiceFactory} from "./ServiceFactory";
import {compare, hash} from "bcrypt-ts"
import {ContentfulStatusCode} from "hono/dist/types/utils/http-status";
import {ELogServiceEvent} from "../enums/LogEvent.enum";
import {socketServiceInstance} from "./singleton/SocketModule";
import {IAuthResponse, IAuthService} from "../interfaces/AuthService.interface";
import {IMongoService} from "../interfaces/MongoService.interface";
import {ITokenPayload, ITokenService} from "../interfaces/TokenService.interface";
import {ILogService} from "../interfaces/LogService.interface";
import {IAccountService, IUserDetails} from "../interfaces/AccountService.interface";
import {ISocketService, IUserSocket} from "../interfaces/SocketService.interface";
import {IGenericResponse} from "../interfaces/utility/General.interface";

const AuthServiceMessages = {
    SIGNUP_EXISTS: "User already exists.",
    SIGNUP_SUCCESS: "User created successfully.",
    SIGNUP_FAILURE: "Unknown error occurred.",
    LOGIN_FAILURE: "User with credentials doesn't exist.",
    LOGIN_SUCCESS: "User logged in successfully.",
    LOGIN_INCORRECT: "Incorrect password.",
    LOGOUT_FAILURE: "Unable to log out successfully."
}

export class AuthService implements IAuthService {
    private _mongoService: IMongoService;
    private _tokenService: ITokenService;
    private _logService: ILogService;
    private _accountService: IAccountService;
    private _socketService: ISocketService;

    constructor() {
        this._mongoService = ServiceFactory.createMongoService();
        this._tokenService = ServiceFactory.createTokenService();
        this._logService = ServiceFactory.createLogService();
        this._accountService = ServiceFactory.createAccountService();
        this._socketService = socketServiceInstance;
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
        if(!accountResponse["status"]) {
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

    async logout(data: ITokenPayload): Promise<IAuthResponse> {
        const response: ITokenPayload = await this._tokenService.revokeRefreshToken(data);
        const findConnection: IUserSocket | null = await this._socketService.getConnection(response["username"] as string);
        if(findConnection === null) {
            return this.authResponse(false, AuthServiceMessages.LOGOUT_FAILURE, 401);
        }

        await this._logService.addLog({
            timestamp: new Date(Date.now()),
            event: ELogServiceEvent.USER_LOGOUT,
            username: response["username"]
        });

        return this.authResponse(true, await this._socketService.removeConnection(findConnection), 200);
    }
}