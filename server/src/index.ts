import { Hono } from 'hono'
import { jwt } from 'hono/jwt'
import 'dotenv/config';
import {authRoute} from "./routes/AuthRoute";
import {accountRoute} from "./routes/AccountRoute";
import {socketRoute} from "./routes/SocketRoute";
import {chatRoute} from "./routes/ChatRoute";
import {friendRoute} from "./routes/FriendRoute";
import {cors} from "hono/cors";
import {ensureValidAccessCookieMiddleware} from "./middleware/EnsureValidAccessCookie.middleware";
import * as process from "node:process";

const app = new Hono()
const origin: string = process.env.ORIGIN as string;

//allowHeaders: ["Content-Type", "Authorization"],

// Login Route
app.use('/auth/*', cors({
  origin: origin,
  allowMethods: ['POST'],
  allowHeaders: ["Content-Type"],
  credentials: true,
}))
app.route('/auth/', authRoute);

// Account Route
app.use('/account/*', cors({
  origin: origin,
  allowMethods: ['GET', 'PUT', 'PATCH'],
  allowHeaders: ["Content-Type"],
  credentials: true,
}));
app.use('/account/*', ensureValidAccessCookieMiddleware);
app.use('/account/*', jwt({ secret: (process.env.ACCESS_TOKEN_SECRET as string)
  , cookie: {key: "access_token", secret: process.env.COOKIE_SECRET}}));
app.route('/account', accountRoute);

// Socket Route
app.use('/socket/*', cors({
  origin: origin,
  allowMethods: ['GET'],
  allowHeaders: ["Content-Type"],
  credentials: true,
}))
app.use('/socket/*', ensureValidAccessCookieMiddleware);
app.use('/socket/*'); // Cannot use JWT Middleware due to WebSocket Route
app.route('/socket', socketRoute);

// Chat Route
app.use('/chat/*', cors({
  origin: origin,
  allowMethods: ['POST', 'PATCH', 'DELETE'],
  allowHeaders: ["Content-Type"],
  credentials: true,
}))
app.use('/chat/*', ensureValidAccessCookieMiddleware);
app.use('/chat/*', jwt({ secret: (process.env.ACCESS_TOKEN_SECRET as string)
  , cookie: {key: "access_token", secret: process.env.COOKIE_SECRET}}));
app.route('/chat', chatRoute);

// Friend Route
app.use('/friend/*', cors({
  origin: origin,
  allowMethods: ['PATCH'],
  allowHeaders: ["Content-Type"],
  credentials: true,
}))
app.use('/friend/*', ensureValidAccessCookieMiddleware);
app.use('/friend/*', jwt({ secret: (process.env.ACCESS_TOKEN_SECRET as string)
  , cookie: {key: "access_token", secret: process.env.COOKIE_SECRET}}));
app.route('/friend', friendRoute);

export default {
  fetch: app.fetch,
  port: process.env.PORT,
}
