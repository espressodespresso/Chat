import {Hono} from "hono";
import {IAuthResponse, IAuthService, IUserDetails} from "../services/AuthService";
import {ServiceFactory} from "../services/ServiceFactory";

export const authRoute = new Hono();
const authService: IAuthService = ServiceFactory.createAuthService();

authRoute.post('/signup', async (c) => {
    const body: IUserDetails = await c.req.json();
    const response: IAuthResponse = await authService.signup(body["username"], body["password"]);
    return c.json(response);
})

authRoute.post('/login', async (c) => {
    const body: IUserDetails = await c.req.json();
    const response: IAuthResponse = await authService.login(body["username"], body["password"]);
    return c.json(response);
})