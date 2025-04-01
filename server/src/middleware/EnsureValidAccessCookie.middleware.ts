import {Context, MiddlewareHandler, Next} from "hono";
import {getSignedCookie} from "hono/cookie";

export const ensureValidAccessCookieMiddleware: MiddlewareHandler = async (c: Context, next: Next) => {
    const secret: string = process.env.COOKIE_SECRET as string;
    const access_token: string | false | undefined = await getSignedCookie(c, secret, "access_token");

    if (!access_token) {
        const originalUrl: string = encodeURIComponent(c.req.url);
        return c.redirect(`/auth/refresh?redirect=${originalUrl}`);
    }

    await next();
}