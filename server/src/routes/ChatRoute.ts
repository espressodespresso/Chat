import {Hono} from "hono";
import {JWTPayload} from "hono/dist/types/utils/jwt/types";
import {
    ChangeChatNameRequest,
    CreateChatRequest,
    DeleteChatRequest,
    UserAddRemoveRequest
} from "../interfaces/types/ChatRequest.types";

export const chatRoute = new Hono();

chatRoute.post('/create', async (c) => {
    const payload: JWTPayload = c.get("jwtPayload");
    const createObject: CreateChatRequest = await c.req.json();

})

chatRoute.patch('/changeName', async (c) => {
    const payload: JWTPayload = c.get("jwtPayload");
    const changeObject: ChangeChatNameRequest = await c.req.json();

})

chatRoute.patch('/addAdmin', async (c) => {
    const payload: JWTPayload = c.get("jwtPayload");
    const changeObject: UserAddRemoveRequest = await c.req.json();
})

chatRoute.patch('/removeAdmin', async (c) => {
    const payload: JWTPayload = c.get("jwtPayload");
    const changeObject: UserAddRemoveRequest = await c.req.json();
})

chatRoute.patch('/addUser', async (c) => {
    const payload: JWTPayload = c.get("jwtPayload");
    const changeObject: UserAddRemoveRequest = await c.req.json();
})

chatRoute.patch('/removeUser', async (c) => {
    const payload: JWTPayload = c.get("jwtPayload");
    const changeObject: UserAddRemoveRequest = await c.req.json();
})


chatRoute.delete('/delete', async (c) => {
    const payload: JWTPayload = c.get("jwtPayload");
    const changeObject: DeleteChatRequest = await c.req.json();
})
