import {Hono} from "hono";
import {IAccountService, IUserDetails} from "../interfaces/AccountService.interface";
import {ServiceFactory} from "../services/ServiceFactory";
import {IGeneralUtility, IGenericResponse} from "../interfaces/utility/General.interface";
import {generalUtilityInstance, invalidDataObj} from "../utility/UtilityModule";
import {
    UpdateAccountDetailsRequest,
    UpdateAccountOptionsRequest,
} from "../../../shared/types/AccountRequest.types";
import {IChatUser} from "../interfaces/ChatService.interface";
import {ELogRequestEvent, ELogRouteEvent} from "../enums/LogEvent.enum";
import {ILogService} from "../interfaces/LogService.interface";
import {UpdateAccountDetailsRequestSchema, UpdateAccountOptionsRequestSchema} from "@shared/schemas/AccountRequest.schema";

export const accountRoute = new Hono();
const accountService: IAccountService = ServiceFactory.createAccountService();
const generalUtility: IGeneralUtility = generalUtilityInstance;
const logService: ILogService = ServiceFactory.createLogService();

accountRoute.get('/accountDetails', async (c) => {
    const payload: IUserDetails = c.get("jwtPayload")["data"];
    const user_id: string = payload["user_id"] as string;
    const response: IGenericResponse = await accountService.getAccountDetailsByID(user_id);
    await logService.addLog({
        timestamp: new Date(Date.now()),
        event: ELogRequestEvent.GET,
        route: ELogRouteEvent.ACCOUNT,
        user_id: user_id,
        status_code: response["code"]
    });

    return c.json(response, response["code"]);
})

accountRoute.put('/updateDetails', async (c) => {
    try {
        const payload: IUserDetails = c.get("jwtPayload")["data"];
        const updateAccountDetailsRequest: UpdateAccountDetailsRequest = UpdateAccountDetailsRequestSchema.parse(await c.req.json());
        const recipientUserData: IUserDetails = updateAccountDetailsRequest["user_data"];
        const request_user: IChatUser = {
            user_id: payload["user_id"] as string,
        }

        const recipient_user: IChatUser = {
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
            user_id: request_user["user_id"],
            status_code: response["code"]
        });

        return c.json(response, response["code"]);
    } catch (error) {
        return c.json(invalidDataObj, invalidDataObj["code"]);
    }
})

accountRoute.patch('/updateOptions', async (c) => {
    try {
        const payload: IUserDetails = c.get("jwtPayload")["data"];
        const updateAccountOptionsRequest: UpdateAccountOptionsRequest = UpdateAccountOptionsRequestSchema.parse(await c.req.json());
        const request_user: IChatUser = {
            user_id: payload["user_id"] as string,
        }

        if(!generalUtility.verifyUserAccess(request_user, updateAccountOptionsRequest["user"])) {
            const response: IGenericResponse = generalUtility.genericResponse(false, generalUtility.noUserAccessString(), 401);
            return c.json(response, response["code"]);
        }

        const response: IGenericResponse = await accountService.updateUserOptions(request_user["user_id"]
            , updateAccountOptionsRequest["data"])
        await logService.addLog({
            timestamp: new Date(Date.now()),
            event: ELogRequestEvent.PATCH,
            route: ELogRouteEvent.ACCOUNT,
            user_id: request_user["user_id"],
            status_code: response["code"]
        });

        return c.json(response, response["code"]);
    } catch (error) {
        return c.json(invalidDataObj, invalidDataObj["code"]);
    }
})