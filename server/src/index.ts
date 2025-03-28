import { Hono } from 'hono'
import { jwt } from 'hono/jwt'
import 'dotenv/config';
import {authRoute} from "./routes/AuthRoute";
import {accountRoute} from "./routes/AccountRoute";
import {socketRoute} from "./routes/SocketRoute";
import {chatRoute} from "./routes/ChatRoute";
import {friendRoute} from "./routes/FriendRoute";
import {cors} from "hono/cors";

const app = new Hono()
const origin: string = process.env.ORIGIN as string;

// Auth Route
app.use('/auth/*', cors({
  origin: origin,
  allowMethods: ['POST'],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}))
app.route('/auth/', authRoute);

// Account Route
app.use('/account/*', cors({
  origin: origin,
  allowMethods: ['GET', 'PUT', 'PATCH'],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));
app.use('/account/*', jwt({ secret: (process.env.ACCESS_TOKEN_SECRET as string) }));
app.route('/account', accountRoute);

// Socket Route
app.use('/socket/*', cors({
  origin: origin,
  allowMethods: ['GET'],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}))
app.use('/socket/*'); // Cannot use JWT Middleware due to WebSocket Route
app.route('/socket', socketRoute);

// Chat Route
app.use('/chat/*', cors({
  origin: origin,
  allowMethods: ['POST', 'PATCH', 'DELETE'],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}))
app.use('/chat/*', jwt({ secret: (process.env.ACCESS_TOKEN_SECRET as string) }));
app.route('/chat', chatRoute);

// Friend Route
app.use('/friend/*', cors({
  origin: origin,
  allowMethods: ['PATCH'],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}))
app.use('/friend/*', jwt({ secret: (process.env.ACCESS_TOKEN_SECRET as string) }));
app.route('/friend', friendRoute);

export default {
  fetch: app.fetch,
  port: process.env.PORT,
}
