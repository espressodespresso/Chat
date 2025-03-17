import {Hono} from "hono";
import {decode} from "hono/jwt"

export const accountRoute = new Hono();

accountRoute.get('/details', async (c) => {
    //const { header, payload } = decode();
    //return c.json(payload["data"] as object);
})