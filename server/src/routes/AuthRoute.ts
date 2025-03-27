import {Hono} from "hono";
import {ServiceFactory} from "../services/ServiceFactory";
import {ELogRequestEvent, ELogRouteEvent} from "../enums/LogEvent.enum";
import {IAuthResponse, IAuthService} from "../interfaces/AuthService.interface";
import {ITokenPayload, ITokenService} from "../interfaces/TokenService.interface";
import {ILogService} from "../interfaces/LogService.interface";
import {IAccountService, IUserDetails} from "../interfaces/AccountService.interface";
import {IGenericResponse} from "../interfaces/utility/General.interface";
import {
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    SignupRequest,
} from "../types/AuthRequest.types";
import {invalidDataObj} from "../utility/UtilityModule";
import {
    LoginRequestSchema,
    LogoutRequestSchema,
    RefreshRequestSchema,
    SignupRequestSchema
} from "../schemas/AuthRequest.schema";

export const authRoute = new Hono();
const authService: IAuthService = ServiceFactory.createAuthService();
const tokenService: ITokenService = ServiceFactory.createTokenService();
const logService: ILogService = ServiceFactory.createLogService();
const accountService: IAccountService = ServiceFactory.createAccountService();

authRoute.post('/signup', async (c) => {
    try {
        const signupRequest: SignupRequest = SignupRequestSchema.parse(await c.req.json());
        const username: string = signupRequest["username"];
        const response: IAuthResponse = await authService.signup(username, signupRequest["password"], signupRequest["email"]);

        await logService.addLog({
            timestamp: new Date(Date.now()),
            event: ELogRequestEvent.POST,
            route: ELogRouteEvent.AUTH,
            user_id: (await accountService.getUserIDByUsername(username) as IGenericResponse)["result"],
            status_code: response["code"]
        });
        return c.json(response, response["code"]);
    } catch (error) {
        return c.json(invalidDataObj, invalidDataObj["code"]);
    }
})

authRoute.post('/login', async (c) => {
    try {
        const loginRequest: LoginRequest = LoginRequestSchema.parse(await c.req.json());
        const username: string = loginRequest["username"];
        const response: IAuthResponse = await authService.login(username, loginRequest["password"]);
        await logService.addLog({
            timestamp: new Date(Date.now()),
            event: ELogRequestEvent.POST,
            route: ELogRouteEvent.AUTH,
            user_id: (await accountService.getUserIDByUsername(username) as IGenericResponse)["result"],
            status_code: response["code"]
        });

        try {
            delete (response["token"] as ITokenPayload)["user_id"];
        } catch (error) {
            console.error("Login credentials error.");
        }
        return c.json(response, response["code"]);
    } catch (error) {
        return c.json(invalidDataObj, invalidDataObj["code"]);
    }
})

authRoute.post('/refresh', async (c) => {
    try {
        const refreshRequest: RefreshRequest = RefreshRequestSchema.parse(await c.req.json());
        const response: ITokenPayload = await tokenService.generateNewAuth(refreshRequest["refresh_token"]);
        await logService.addLog({
            timestamp: new Date(Date.now()),
            event: ELogRequestEvent.POST,
            route: ELogRouteEvent.AUTH,
            user_id: (await accountService.getUserIDByUsername(response["user_id"] as string) as IGenericResponse)["result"],
            status_code: response["code"]
        });
        delete response["user_id"];
        return c.json(response, response["code"]);
    } catch (error) {
        return c.json(invalidDataObj, invalidDataObj["code"]);
    }
})

authRoute.post('/logout', async (c) => {
    try {
        const logoutRequest: LogoutRequest = LogoutRequestSchema.parse(await c.req.json());
        const response: IAuthResponse = await authService.logout(logoutRequest["refresh_token"]);
        await logService.addLog({
            timestamp: new Date(Date.now()),
            event: ELogRequestEvent.POST,
            route: ELogRouteEvent.AUTH,
            user_id: response["message"].split(" ")[0],
            status_code: response["code"]
        });
        return c.json(response, response["code"]);
    } catch (error) {
        return c.json(invalidDataObj, invalidDataObj["code"]);
    }
})