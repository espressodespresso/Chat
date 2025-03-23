import { Hono } from 'hono'
import { jwt } from 'hono/jwt'
import 'dotenv/config';
import {authRoute} from "./routes/AuthRoute";
import {accountRoute} from "./routes/AccountRoute";
import {socketRoute} from "./routes/SocketRoute";
import {chatRoute} from "./routes/ChatRoute";
import {friendRoute} from "./routes/FriendRoute";

const app = new Hono()

app.route('/auth/', authRoute);

app.use('/account/*', jwt({ secret: (process.env.ACCESS_TOKEN_SECRET as string) }));
app.route('/account', accountRoute);

app.use('/socket/*'); // Cannot use JWT Middleware due to WebSocket Route
app.route('/socket', socketRoute);

app.use('/chat/*', jwt({ secret: (process.env.ACCESS_TOKEN_SECRET as string) }));
app.route('/chat', chatRoute);

app.use('/friend/*', jwt({ secret: (process.env.ACCESS_TOKEN_SECRET as string) }));
app.route('/friend', friendRoute);

export default {
  fetch: app.fetch,
  port: process.env.PORT,
}
