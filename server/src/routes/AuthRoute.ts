import {Hono} from "hono";
import {IAuthResponse, IAuthService, IUserDetails} from "../services/AuthService";
import {ServiceFactory} from "../services/ServiceFactory";
import {ITokenPayload, ITokenService} from "../services/TokenService";

export const authRoute = new Hono();
const authService: IAuthService = ServiceFactory.createAuthService();
const tokenService: ITokenService = ServiceFactory.createTokenService();

authRoute.post('/signup', async (c) => {
    const body: IUserDetails = await c.req.json();
    const response: IAuthResponse = await authService.signup(body["username"], body["password"]);
    return c.json(response, response["code"]);
})

authRoute.post('/login', async (c) => {
    const body: IUserDetails = await c.req.json();
    const response: IAuthResponse = await authService.login(body["username"], body["password"]);
    return c.json(response, response["code"]);
})

authRoute.post('/refresh', async (c) => {
    const body: ITokenPayload = await c.req.json();
    const response: ITokenPayload = await tokenService.generateNewAuth(body);
    return c.json(response, response["code"]);
})

authRoute.post('/logout', async (c) => {
    const body: ITokenPayload = await c.req.json();
    const response: ITokenPayload = await tokenService.revokeRefreshToken(body);
    return c.json(response, response["code"]);
})