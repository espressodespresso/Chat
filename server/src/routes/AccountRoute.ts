import {Hono} from "hono";
import {decode} from "hono/jwt"
import {JWTPayload} from "hono/dist/types/utils/jwt/types";
import {IAccountService, IUserDetails} from "../interfaces/AccountService.interface";
import {ServiceFactory} from "../services/ServiceFactory";
import {IGeneralUtility, IGenericResponse} from "../interfaces/utility/General.interface";
import {generalUtilityInstance} from "../utility/UtilityModule";
import {
    GetAccountDetailsRequest,
    UpdateAccountDetailsRequest,
    UpdateAccountOptionsRequest
} from "../interfaces/types/AccountRequest.types";
import {IChatUser} from "../interfaces/ChatService.interface";
import {ELogRequestEvent, ELogRouteEvent} from "../enums/LogEvent.enum";
import {ILogService} from "../interfaces/LogService.interface";

export const accountRoute = new Hono();
const accountService: IAccountService = ServiceFactory.createAccountService();
const generalUtility: IGeneralUtility = generalUtilityInstance;
const logService: ILogService = ServiceFactory.createLogService();

accountRoute.get('/accountDetails', async (c) => {
    const payload: IUserDetails = c.get("jwtPayload")["data"];
    const accountDetailsRequest: GetAccountDetailsRequest = await c.req.json();
    const request_user: IChatUser = {
        username: payload["username"] as string,
        user_id: payload["user_id"] as string,
    }

    if(!generalUtility.verifyUserAccess(request_user, accountDetailsRequest["user"])) {
        const response: IGenericResponse = generalUtility.genericResponse(false, generalUtility.noUserAccessString(), 401);
        return c.json(response, response["code"]);
    }

    const response: IGenericResponse = await accountService.getAccountDetails(accountDetailsRequest["user"]["username"]);
    await logService.addLog({
        timestamp: new Date(Date.now()),
        event: ELogRequestEvent.GET,
        route: ELogRouteEvent.ACCOUNT,
        username: request_user["username"],
        status_code: response["code"]
    });

    return c.json(response, response["code"]);
})

accountRoute.put('/updateDetails', async (c) => {
    const payload: IUserDetails = c.get("jwtPayload")["data"];
    const updateAccountDetailsRequest: UpdateAccountDetailsRequest = await c.req.json();
    const recipientUserData: IUserDetails = updateAccountDetailsRequest["user_data"];
    const request_user: IChatUser = {
        username: payload["username"] as string,
        user_id: payload["user_id"] as string,
    }

    const recipient_user: IChatUser = {
        username: recipientUserData["username"],
        user_id: recipientUserData["user_id"],
    }

    if(!generalUtility.verifyUserAccess(request_user, recipient_user)) {
        const response: IGenericResponse = generalUtility.genericResponse(false, generalUtility.noUserAccessString(), 401);
        return c.json(response, response["code"]);
    }

    const response: IGenericResponse = await accountService.updateAccountDetails(recipientUserData);
    await logService.addLog({
        timestamp: new Date(Date.now()),
        event: ELogRequestEvent.PUT,
        route: ELogRouteEvent.ACCOUNT,
        username: request_user["username"],
        status_code: response["code"]
    });

    return c.json(response, response["code"]);
})

accountRoute.patch('/updateOptions', async (c) => {
    const payload: IUserDetails = c.get("jwtPayload")["data"];
    const updateAccountOptionsRequest: UpdateAccountOptionsRequest = await c.req.json();
    const request_user: IChatUser = {
        username: payload["username"] as string,
        user_id: payload["user_id"] as string,
    }

    if(!generalUtility.verifyUserAccess(request_user, updateAccountOptionsRequest["user"])) {
        const response: IGenericResponse = generalUtility.genericResponse(false, generalUtility.noUserAccessString(), 401);
        return c.json(response, response["code"]);
    }

    const response: IGenericResponse = await accountService.updateUserOptions(request_user["username"]
        , updateAccountOptionsRequest["data"])
    await logService.addLog({
        timestamp: new Date(Date.now()),
        event: ELogRequestEvent.PATCH,
        route: ELogRouteEvent.ACCOUNT,
        username: request_user["username"],
        status_code: response["code"]
    });

    return c.json(response, response["code"]);
})