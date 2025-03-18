import {Hono} from "hono";

export const socketRoute = new Hono();

socketRoute.get('/', async (c) => {

})