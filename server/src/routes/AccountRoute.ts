import {Hono} from "hono";
import {decode} from "hono/jwt"
import {JWTPayload} from "hono/dist/types/utils/jwt/types";

export const accountRoute = new Hono();

accountRoute.get('/details', async (c) => {
    const payload: JWTPayload = c.get("jwtPayload");

})