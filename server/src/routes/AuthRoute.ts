import {Hono} from "hono";
import {IAuthResponse, IAuthService} from "../services/AuthService";
import {ServiceFactory} from "../services/ServiceFactory";
import {ITokenPayload, ITokenService} from "../services/TokenService";
import {ELogRequestEvent, ELogRouteEvent} from "../enums/LogEvent.enum";
import {ILogService} from "../services/LogService";
import {IUserDetails} from "../services/AccountService";

export const authRoute = new Hono();
const authService: IAuthService = ServiceFactory.createAuthService();
const tokenService: ITokenService = ServiceFactory.createTokenService();
const logService: ILogService = ServiceFactory.createLogService();

authRoute.post('/signup', async (c) => {
    const body: IUserDetails = await c.req.json();
    const username: string = body["username"];
    const response: IAuthResponse = await authService.signup(username, body["password"], body["email"]);
    await logService.addLog({
        timestamp: new Date(Date.now()),
        event: ELogRequestEvent.POST,
        route: ELogRouteEvent.AUTH,
        username: username,
        status_code: response["code"]
    });
    return c.json(response, response["code"]);
})

authRoute.post('/login', async (c) => {
    const body: IUserDetails = await c.req.json();
    const username: string = body["username"];
    const response: IAuthResponse = await authService.login(username, body["password"]);
    await logService.addLog({
        timestamp: new Date(Date.now()),
        event: ELogRequestEvent.POST,
        route: ELogRouteEvent.AUTH,
        username: username,
        status_code: response["code"]
    });
    try {
        delete (response["token"] as ITokenPayload)["username"];
    } catch (error) {
        console.error("Login credentials error.");
    }
    return c.json(response, response["code"]);
})

authRoute.post('/refresh', async (c) => {
    const body: ITokenPayload = await c.req.json();
    const response: ITokenPayload = await tokenService.generateNewAuth(body);
    await logService.addLog({
        timestamp: new Date(Date.now()),
        event: ELogRequestEvent.POST,
        route: ELogRouteEvent.AUTH,
        username: response["username"],
        status_code: response["code"]
    });
    delete response["username"];
    return c.json(response, response["code"]);
})

authRoute.post('/logout', async (c) => {
    const body: ITokenPayload = await c.req.json();
    const response: ITokenPayload = await tokenService.revokeRefreshToken(body);
    await logService.addLog({
        timestamp: new Date(Date.now()),
        event: ELogRequestEvent.POST,
        route: ELogRouteEvent.AUTH,
        username: response["username"],
        status_code: response["code"]
    });
    delete response["username"];
    return c.json(response, response["code"]);
})