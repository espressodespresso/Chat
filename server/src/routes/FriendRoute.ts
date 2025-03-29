import {Hono} from "hono";
import {IFriendService} from "../interfaces/FriendService.interface";
import {ServiceFactory} from "../services/ServiceFactory";
import {ILogService} from "../interfaces/LogService.interface";
import {FriendAddRemoveRequest} from "@shared/types/FriendRequest.types";
import {IGeneralUtility, IGenericResponse} from "../interfaces/utility/General.interface";
import {generalUtilityInstance, invalidDataObj} from "../utility/UtilityModule";
import {IChatUser} from "../interfaces/ChatService.interface";
import {ELogRequestEvent, ELogRouteEvent} from "../enums/LogEvent.enum";
import {IUserDetails} from "../interfaces/AccountService.interface";
import {FriendAddRemoveRequestSchema} from "@shared/schemas/FriendRequest.schema";

export const friendRoute = new Hono();
const friendService: IFriendService = ServiceFactory.createFriendService();
const logService: ILogService = ServiceFactory.createLogService();
const generalUtility: IGeneralUtility = generalUtilityInstance;

friendRoute.patch('/addFriend', async (c) => {
    try {
        const payload: IUserDetails = c.get("jwtPayload")["data"];
        const friendAddRemoveRequest: FriendAddRemoveRequest = FriendAddRemoveRequestSchema.parse(await c.req.json());
        const recipient_user: IChatUser = friendAddRemoveRequest["recipient_user"];
        const request_user: IChatUser = {
            user_id: payload["user_id"] as string
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
            user_id: request_user["user_id"],
            recipient_id: recipient_user["user_id"],
            status_code: response["code"]
        });

        return c.json(response, response["code"]);
    } catch (error) {
        return c.json(invalidDataObj, invalidDataObj["code"]);
    }
})

friendRoute.patch('/removeFriend', async (c) => {
    try {
        const payload: IUserDetails = c.get("jwtPayload")["data"];
        const friendAddRemoveRequest: FriendAddRemoveRequest = FriendAddRemoveRequestSchema.parse(await c.req.json());
        const recipient_user: IChatUser = friendAddRemoveRequest["recipient_user"];
        const request_user: IChatUser = {
            user_id: payload["user_id"] as string
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
            user_id: request_user["user_id"],
            recipient_id: recipient_user["user_id"],
            status_code: response["code"]
        });

        return c.json(response, response["code"]);
    } catch (error) {
        return c.json(invalidDataObj, invalidDataObj["code"]);
    }
})

friendRoute.patch('/block', async (c) => {
    try {
        const payload: IUserDetails = c.get("jwtPayload")["data"];
        const friendAddRemoveRequest: FriendAddRemoveRequest = FriendAddRemoveRequestSchema.parse(await c.req.json());
        const recipient_user: IChatUser = friendAddRemoveRequest["recipient_user"];
        const request_user: IChatUser = {
            user_id: payload["user_id"] as string
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
            user_id: request_user["user_id"],
            recipient_id: recipient_user["user_id"],
            status_code: response["code"]
        });

        return c.json(response, response["code"]);
    } catch (error) {
        return c.json(invalidDataObj, invalidDataObj["code"]);
    }
})

friendRoute.patch('/unblock', async (c) => {
    try {
        const payload: IUserDetails = c.get("jwtPayload")["data"];
        const friendAddRemoveRequest: FriendAddRemoveRequest = FriendAddRemoveRequestSchema.parse(await c.req.json());
        const recipient_user: IChatUser = friendAddRemoveRequest["recipient_user"];
        const request_user: IChatUser = {
            user_id: payload["user_id"] as string
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
            user_id: request_user["user_id"],
            recipient_id: recipient_user["user_id"],
            status_code: response["code"]
        });

        return c.json(response, response["code"]);
    } catch (error) {
        return c.json(invalidDataObj, invalidDataObj["code"]);
    }
})