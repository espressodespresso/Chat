import {Hono} from "hono";
import {IFriendService} from "../interfaces/FriendService.interface";
import {ServiceFactory} from "../services/ServiceFactory";
import {ILogService} from "../interfaces/LogService.interface";
import {FriendAddRemoveRequest} from "../interfaces/types/FriendRequest.types";
import {IGeneralUtility, IGenericResponse} from "../interfaces/utility/General.interface";
import {generalUtilityInstance} from "../utility/UtilityModule";
import {IChatUser} from "../interfaces/ChatService.interface";
import {ELogRequestEvent, ELogRouteEvent} from "../enums/LogEvent.enum";
import {IUserDetails} from "../interfaces/AccountService.interface";

export const friendRoute = new Hono();
const friendService: IFriendService = ServiceFactory.createFriendService();
const logService: ILogService = ServiceFactory.createLogService();
const generalUtility: IGeneralUtility = generalUtilityInstance;

friendRoute.patch('/addFriend', async (c) => {
    const payload: IUserDetails = c.get("jwtPayload")["data"];
    const recipient_user: IChatUser = (await c.req.json() as FriendAddRemoveRequest)["recipient_user"];
    const request_user: IChatUser = {
        username: payload["username"] as string,
        user_id: payload["user_id"] as string,
    }

    if(!generalUtility.verifyUserAccess(request_user, recipient_user)) {
        const response: IGenericResponse = generalUtility.genericResponse(false, generalUtility.noUserAccessString(), 401);
        return c.json(response, response["code"]);
    }

    const response: IGenericResponse = await friendService.addFriend(request_user, recipient_user);
    await logService.addLog({
        timestamp: new Date(Date.now()),
        event: ELogRequestEvent.PATCH,
        route: ELogRouteEvent.FRIEND,
        username: request_user["username"],
        recipient_username: recipient_user["username"],
        status_code: response["code"]
    });

    return c.json(response, response["code"]);
})

friendRoute.patch('/removeFriend', async (c) => {
    const payload: IUserDetails = c.get("jwtPayload")["data"];
    const recipient_user: IChatUser = (await c.req.json() as FriendAddRemoveRequest)["recipient_user"];
    const request_user: IChatUser = {
        username: payload["username"] as string,
        user_id: payload["user_id"] as string,
    }

    if(!generalUtility.verifyUserAccess(request_user, recipient_user)) {
        const response: IGenericResponse = generalUtility.genericResponse(false, generalUtility.noUserAccessString(), 401);
        return c.json(response, response["code"]);
    }

    const response: IGenericResponse = await friendService.removeFriend(request_user, recipient_user);
    await logService.addLog({
        timestamp: new Date(Date.now()),
        event: ELogRequestEvent.PATCH,
        route: ELogRouteEvent.FRIEND,
        username: request_user["username"],
        recipient_username: recipient_user["username"],
        status_code: response["code"]
    });

    return c.json(response, response["code"]);
})

friendRoute.patch('/block', async (c) => {
    const payload: IUserDetails = c.get("jwtPayload")["data"];
    const recipient_user: IChatUser = (await c.req.json() as FriendAddRemoveRequest)["recipient_user"];
    const request_user: IChatUser = {
        username: payload["username"] as string,
        user_id: payload["user_id"] as string,
    }

    if(!generalUtility.verifyUserAccess(request_user, recipient_user)) {
        const response: IGenericResponse = generalUtility.genericResponse(false, generalUtility.noUserAccessString(), 401);
        return c.json(response, response["code"]);
    }

    const response: IGenericResponse = await friendService.blockFriend(request_user, recipient_user);
    await logService.addLog({
        timestamp: new Date(Date.now()),
        event: ELogRequestEvent.PATCH,
        route: ELogRouteEvent.FRIEND,
        username: request_user["username"],
        recipient_username: recipient_user["username"],
        status_code: response["code"]
    });

    return c.json(response, response["code"]);
})

friendRoute.patch('/unblock', async (c) => {
    const payload: IUserDetails = c.get("jwtPayload")["data"];
    const recipient_user: IChatUser = (await c.req.json() as FriendAddRemoveRequest)["recipient_user"];
    const request_user: IChatUser = {
        username: payload["username"] as string,
        user_id: payload["user_id"] as string,
    }

    if(!generalUtility.verifyUserAccess(request_user, recipient_user)) {
        const response: IGenericResponse = generalUtility.genericResponse(false, generalUtility.noUserAccessString(), 401);
        return c.json(response, response["code"]);
    }

    const response: IGenericResponse = await friendService.unblockFriend(request_user, recipient_user);
    await logService.addLog({
        timestamp: new Date(Date.now()),
        event: ELogRequestEvent.PATCH,
        route: ELogRouteEvent.FRIEND,
        username: request_user["username"],
        recipient_username: recipient_user["username"],
        status_code: response["code"]
    });

    return c.json(response, response["code"]);
})