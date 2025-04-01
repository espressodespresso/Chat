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
} from "@shared/types/AuthRequest.types";
import {invalidDataObj} from "../utility/UtilityModule";
import {
    LoginRequestSchema,
    LogoutRequestSchema,
    RefreshRequestSchema,
    SignupRequestSchema
} from "@shared/schemas/AuthRequest.schema";
import { getSignedCookie, setSignedCookie } from "hono/cookie";
import * as process from "node:process";
import {MongoResponse} from "../interfaces/MongoService.interface";

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

        if(response["status"]) {
            const tokens: ITokenPayload = response["token"] as ITokenPayload;
            const cookie_secret: string = process.env.COOKIE_SECRET as string;
            const access_token: string = tokens["access_token"] as string;
            const refresh_token: string = tokens["refresh_token"] as string;

            await setSignedCookie(c, "access_token", access_token, cookie_secret, {
                httpOnly: true,
                secure: true,
                sameSite: "Strict",
                maxAge: 60 * parseInt((process.env.ACCESS_TOKEN_EXPIRY as string))
            });

            await setSignedCookie(c, "refresh_token", refresh_token, cookie_secret, {
                httpOnly: true,
                secure: true,
                sameSite: "Strict",
                maxAge: 60 * parseInt((process.env.REFRESH_TOKEN_EXPIRY as string))
            });

            delete response["token"];
        }

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

authRoute.post('/refresh', async (c) => {
    try {
        const cookie_secret: string = process.env.COOKIE_SECRET as string;
        const refresh_token: string | false | undefined = await getSignedCookie(c, cookie_secret, "refresh_token");

        if(!refresh_token) {
            return c.text("Unauthorized", 401);
        }

        const response: ITokenPayload = await tokenService.generateNewAuth(refresh_token)

        if((response["response"] as MongoResponse)["status"]) {
            const access_token: string = response["access_token"] as string;
            const refresh_token: string = response["refresh_token"] as string;

            await setSignedCookie(c, "access_token", access_token, cookie_secret, {
                httpOnly: true,
                secure: true,
                sameSite: "Strict",
                maxAge: 60 * parseInt((process.env.ACCESS_TOKEN_EXPIRY as string))
            });

            await setSignedCookie(c, "refresh_token", refresh_token, cookie_secret, {
                httpOnly: true,
                secure: true,
                sameSite: "Strict",
                maxAge: 60 * parseInt((process.env.REFRESH_TOKEN_EXPIRY as string))
            });

            delete response["access_token"];
            delete response["refresh_token"];
        }

        await logService.addLog({
            timestamp: new Date(Date.now()),
            event: ELogRequestEvent.POST,
            route: ELogRouteEvent.AUTH,
            user_id: (await accountService.getUserIDByUsername(response["user_id"] as string) as IGenericResponse)["result"],
            status_code: response["code"]
        });


        return c.redirect(c.req.query('redirect') as string);
    } catch (error) {
        return c.json(invalidDataObj, invalidDataObj["code"]);
    }
})

authRoute.post('/logout', async (c) => {
    try {
        const cookie_secret: string = process.env.COOKIE_SECRET as string;
        const refresh_token: string | false | undefined = await getSignedCookie(c, cookie_secret, "refresh_token");

        console.log(refresh_token);
        if(!refresh_token) {
            return c.text("Unauthorized", 401);
        }

        const response: IAuthResponse = await authService.logout(refresh_token);

        const access_token: string | false | undefined = await getSignedCookie(c, cookie_secret, "access_token");
        const date: Date = new Date(Date.now());
        if(access_token) {
            await setSignedCookie(c, "access_token", access_token, cookie_secret, {
                httpOnly: true,
                secure: true,
                sameSite: "Strict",
                maxAge: 0
            });
        }

        await setSignedCookie(c, "refresh_token", refresh_token, cookie_secret, {
            httpOnly: true,
            secure: true,
            sameSite: "Strict",
            maxAge: 0
        });

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