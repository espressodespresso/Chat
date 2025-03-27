import {Hono} from "hono";
import {JWTPayload} from "hono/dist/types/utils/jwt/types";
import {
    ChangeChatNameRequest,
    CreateChatRequest,
    DeleteChatRequest,
    UserAddRemoveRequest,
} from "../types/ChatRequest.types";
import {IGeneralUtility, IGenericResponse} from "../interfaces/utility/General.interface";
import {IChatService, IChatUser} from "../interfaces/ChatService.interface";
import {ServiceFactory} from "../services/ServiceFactory";
import {ELogRequestEvent, ELogRouteEvent} from "../enums/LogEvent.enum";
import {ILogService} from "../interfaces/LogService.interface";
import {generalUtilityInstance, invalidDataObj} from "../utility/UtilityModule";
import {IUserDetails} from "../interfaces/AccountService.interface";
import {
    ChangeChatNameRequestSchema,
    CreateChatRequestSchema,
    DeleteChatRequestSchema,
    UserAddRemoveRequestSchema
} from "../schemas/ChatRequest.schema";

export const chatRoute = new Hono();
const chatService: IChatService = ServiceFactory.createChatService();
const logService: ILogService = ServiceFactory.createLogService();
const generalUtility: IGeneralUtility = generalUtilityInstance;

chatRoute.post('/create', async (c) => {
    try {
        const payload: IUserDetails = c.get("jwtPayload")["data"];
        const createChatRequest: CreateChatRequest = CreateChatRequestSchema.parse(await c.req.json());
        const creator_user: IChatUser = {
            user_id: payload["user_id"] as string
        };

        const response: IGenericResponse = await chatService.createChat(createChatRequest["chat_name"]
            , creator_user, createChatRequest["users"]);
        await logService.addLog({
            timestamp: new Date(Date.now()),
            event: ELogRequestEvent.POST,
            route: ELogRouteEvent.CHAT,
            user_id: creator_user["user_id"],
            status_code: response["code"]
        });

        return c.json(response, response["code"]);
    } catch (error) {
        return c.json(invalidDataObj, invalidDataObj["code"]);
    }
})

chatRoute.patch('/changeName', async (c) => {
    try {
        const payload: IUserDetails = c.get("jwtPayload")["data"];
        const changeChatNameRequest: ChangeChatNameRequest = ChangeChatNameRequestSchema.parse(await c.req.json());
        const user: IChatUser = {
            user_id: payload["user_id"] as string
        };
        const response: IGenericResponse = await chatService.changeChatName(changeChatNameRequest["chat_id"]
            , user, changeChatNameRequest["new_name"]);
        await logService.addLog({
            timestamp: new Date(Date.now()),
            event: ELogRequestEvent.PATCH,
            route: ELogRouteEvent.CHAT,
            user_id: user["user_id"],
            status_code: response["code"]
        });

        return c.json(response, response["code"]);
    } catch (error) {
        return c.json(invalidDataObj, invalidDataObj["code"]);
    }
})

chatRoute.patch('/addAdmin', async (c) => {
    try {
        const payload: IUserDetails = c.get("jwtPayload")["data"];
        const addAdminRequest: UserAddRemoveRequest = UserAddRemoveRequestSchema.parse(await c.req.json());
        const request_user: IChatUser = {
            user_id: payload["user_id"] as string
        };

        if(!generalUtility.verifyUserAccess(request_user, addAdminRequest["recipient_user"])) {
            const response: IGenericResponse = generalUtility.genericResponse(false, generalUtility.noUserAccessString(), 401);
            return c.json(response, response["code"]);
        }

        const recipient_user: IChatUser = addAdminRequest["recipient_user"];
        const response: IGenericResponse = await chatService.addAdmin(addAdminRequest["chat_id"]
            , request_user, recipient_user);
        await logService.addLog({
            timestamp: new Date(Date.now()),
            event: ELogRequestEvent.PATCH,
            route: ELogRouteEvent.CHAT,
            user_id: request_user["user_id"],
            recipient_id: recipient_user["user_id"],
            status_code: response["code"]
        });

        return c.json(response, response["code"]);
    } catch (error) {
        return c.json(invalidDataObj, invalidDataObj["code"]);
    }
})

chatRoute.patch('/removeAdmin', async (c) => {
    try {
        const payload: IUserDetails = c.get("jwtPayload")["data"];
        const removeAdminRequest: UserAddRemoveRequest = UserAddRemoveRequestSchema.parse(await c.req.json());
        const request_user: IChatUser = {
            user_id: payload["user_id"] as string
        };

        const recipient_user: IChatUser = removeAdminRequest["recipient_user"];
        const response: IGenericResponse = await chatService.removeAdmin(removeAdminRequest["chat_id"]
            , request_user, recipient_user);
        await logService.addLog({
            timestamp: new Date(Date.now()),
            event: ELogRequestEvent.PATCH,
            route: ELogRouteEvent.CHAT,
            user_id: request_user["user_id"],
            recipient_id: recipient_user["user_id"],
            status_code: response["code"]
        });

        return c.json(response, response["code"]);
    } catch (error) {
        return c.json(invalidDataObj, invalidDataObj["code"]);
    }
})

chatRoute.patch('/addUser', async (c) => {
    try {
        const payload: IUserDetails = c.get("jwtPayload")["data"];
        const addUserRequest: UserAddRemoveRequest = UserAddRemoveRequestSchema.parse(await c.req.json());
        const request_user: IChatUser = {
            user_id: payload["user_id"] as string
        };

        if(!generalUtility.verifyUserAccess(request_user, addUserRequest["recipient_user"])) {
            const response: IGenericResponse = generalUtility.genericResponse(false, generalUtility.noUserAccessString(), 401);
            return c.json(response, response["code"]);
        }

        const recipient_user: IChatUser = addUserRequest["recipient_user"];
        const response: IGenericResponse = await chatService.addUser(addUserRequest["chat_id"]
            , request_user, recipient_user);
        await logService.addLog({
            timestamp: new Date(Date.now()),
            event: ELogRequestEvent.PATCH,
            route: ELogRouteEvent.CHAT,
            user_id: request_user["user_id"],
            recipient_id: recipient_user["user_id"],
            status_code: response["code"]
        });

        return c.json(response, response["code"]);
    } catch (error) {
        return c.json(invalidDataObj, invalidDataObj["code"]);
    }
})

chatRoute.patch('/removeUser', async (c) => {
    try {
        const payload: IUserDetails = c.get("jwtPayload")["data"];
        const removeUserRequest: UserAddRemoveRequest = UserAddRemoveRequestSchema.parse(await c.req.json());
        const request_user: IChatUser = {
            user_id: payload["user_id"] as string
        };

        const recipient_user: IChatUser = removeUserRequest["recipient_user"];
        const response: IGenericResponse = await chatService.removeUser(removeUserRequest["chat_id"]
            , request_user, recipient_user);
        await logService.addLog({
            timestamp: new Date(Date.now()),
            event: ELogRequestEvent.PATCH,
            route: ELogRouteEvent.CHAT,
            user_id: request_user["user_id"],
            recipient_id: recipient_user["user_id"],
            status_code: response["code"]
        });

        return c.json(response, response["code"]);
    } catch (error) {
        return c.json(invalidDataObj, invalidDataObj["code"]);
    }
})


chatRoute.delete('/delete', async (c) => {
    try {
        const payload: IUserDetails = c.get("jwtPayload")["data"];
        const deleteChatRequest: DeleteChatRequest = DeleteChatRequestSchema.parse(await c.req.json());
        const request_user: IChatUser = {
            user_id: payload["user_id"] as string
        };
        const response: IGenericResponse = await chatService.deleteChat(deleteChatRequest["chat_id"], request_user);
        await logService.addLog({
            timestamp: new Date(Date.now()),
            event: ELogRequestEvent.DELETE,
            route: ELogRouteEvent.CHAT,
            user_id: request_user["user_id"],
            status_code: response["code"]
        });

        return c.json(response, response["code"]);
    } catch (error) {
        return c.json(invalidDataObj, invalidDataObj["code"]);
    }
})
