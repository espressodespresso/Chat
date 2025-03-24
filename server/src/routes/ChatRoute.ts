import {Hono} from "hono";
import {JWTPayload} from "hono/dist/types/utils/jwt/types";
import {
    ChangeChatNameRequest,
    CreateChatRequest,
    DeleteChatRequest,
    UserAddRemoveRequest
} from "../interfaces/types/ChatRequest.types";
import {IGeneralUtility, IGenericResponse} from "../interfaces/utility/General.interface";
import {IChatService, IChatUser} from "../interfaces/ChatService.interface";
import {ServiceFactory} from "../services/ServiceFactory";
import {ELogRequestEvent, ELogRouteEvent} from "../enums/LogEvent.enum";
import {ILogService} from "../interfaces/LogService.interface";
import {generalUtilityInstance} from "../utility/UtilityModule";

export const chatRoute = new Hono();
const chatService: IChatService = ServiceFactory.createChatService();
const logService: ILogService = ServiceFactory.createLogService();
const generalUtility: IGeneralUtility = generalUtilityInstance;

chatRoute.post('/create', async (c) => {
    const payload: JWTPayload = c.get("jwtPayload");
    const createChatRequest: CreateChatRequest = await c.req.json();
    const creator_user: IChatUser = {
        user_id: payload["user_id"] as string,
        username: payload["username"] as string,
    };

    const response: IGenericResponse = await chatService.createChat(createChatRequest["chat_name"]
        , creator_user, createChatRequest["users"]);
    await logService.addLog({
        timestamp: new Date(Date.now()),
        event: ELogRequestEvent.POST,
        route: ELogRouteEvent.CHAT,
        username: creator_user["username"],
        status_code: response["code"]
    });

    return c.json(response, response["code"]);
})

chatRoute.patch('/changeName', async (c) => {
    const payload: JWTPayload = c.get("jwtPayload");
    const changeChatNameRequest: ChangeChatNameRequest = await c.req.json();
    const user: IChatUser = {
        user_id: payload["user_id"] as string,
        username: payload["username"] as string,
    };
    const response: IGenericResponse = await chatService.changeChatName(changeChatNameRequest["chat_id"]
        , user, changeChatNameRequest["new_name"]);
    await logService.addLog({
        timestamp: new Date(Date.now()),
        event: ELogRequestEvent.PATCH,
        route: ELogRouteEvent.CHAT,
        username: user["username"],
        status_code: response["code"]
    });

    return c.json(response, response["code"]);
})

chatRoute.patch('/addAdmin', async (c) => {
    const payload: JWTPayload = c.get("jwtPayload");
    const addAdminRequest: UserAddRemoveRequest = await c.req.json();
    const request_user: IChatUser = {
        user_id: payload["user_id"] as string,
        username: payload["username"] as string,
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
        username: request_user["username"],
        recipient_username: recipient_user["username"],
        status_code: response["code"]
    });

    return c.json(response, response["code"]);
})

chatRoute.patch('/removeAdmin', async (c) => {
    const payload: JWTPayload = c.get("jwtPayload");
    const removeAdminRequest: UserAddRemoveRequest = await c.req.json();
    const request_user: IChatUser = {
        user_id: payload["user_id"] as string,
        username: payload["username"] as string,
    };

    const recipient_user: IChatUser = removeAdminRequest["recipient_user"];
    const response: IGenericResponse = await chatService.removeAdmin(removeAdminRequest["chat_id"]
        , request_user, recipient_user);
    await logService.addLog({
        timestamp: new Date(Date.now()),
        event: ELogRequestEvent.PATCH,
        route: ELogRouteEvent.CHAT,
        username: request_user["username"],
        recipient_username: recipient_user["username"],
        status_code: response["code"]
    });

    return c.json(response, response["code"]);
})

chatRoute.patch('/addUser', async (c) => {
    const payload: JWTPayload = c.get("jwtPayload");
    const addUserRequest: UserAddRemoveRequest = await c.req.json();
    const request_user: IChatUser = {
        user_id: payload["user_id"] as string,
        username: payload["username"] as string,
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
        username: request_user["username"],
        recipient_username: recipient_user["username"],
        status_code: response["code"]
    });

    return c.json(response, response["code"]);
})

chatRoute.patch('/removeUser', async (c) => {
    const payload: JWTPayload = c.get("jwtPayload");
    const removeUserRequest: UserAddRemoveRequest = await c.req.json();
    const request_user: IChatUser = {
        user_id: payload["user_id"] as string,
        username: payload["username"] as string,
    };

    const recipient_user: IChatUser = removeUserRequest["recipient_user"];
    const response: IGenericResponse = await chatService.removeUser(removeUserRequest["chat_id"]
        , request_user, recipient_user);
    await logService.addLog({
        timestamp: new Date(Date.now()),
        event: ELogRequestEvent.PATCH,
        route: ELogRouteEvent.CHAT,
        username: request_user["username"],
        recipient_username: recipient_user["username"],
        status_code: response["code"]
    });

    return c.json(response, response["code"]);
})


chatRoute.delete('/delete', async (c) => {
    const payload: JWTPayload = c.get("jwtPayload");
    const deleteChatRequest: DeleteChatRequest = await c.req.json();
    const request_user: IChatUser = {
        user_id: payload["user_id"] as string,
        username: payload["username"] as string,
    };
    const response: IGenericResponse = await chatService.deleteChat(deleteChatRequest["chat_id"], request_user);
    await logService.addLog({
        timestamp: new Date(Date.now()),
        event: ELogRequestEvent.DELETE,
        route: ELogRouteEvent.CHAT,
        username: request_user["username"],
        status_code: response["code"]
    });

    return c.json(response, response["code"]);
})
