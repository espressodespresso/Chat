import {Hono} from "hono";
import {JWTPayload} from "hono/dist/types/utils/jwt/types";
import {decode} from "hono/dist/types/middleware/jwt";

export const chatRoute = new Hono();

chatRoute.post('/create', async (c) => {
    const payload: JWTPayload = c.get("jwtPayload");
})