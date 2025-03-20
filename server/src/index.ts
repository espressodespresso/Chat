import { Hono } from 'hono'
import { jwt } from 'hono/jwt'
import 'dotenv/config';
import {authRoute} from "./routes/AuthRoute";
import {accountRoute} from "./routes/AccountRoute";
import {socketRoute} from "./routes/SocketRoute";

const app = new Hono()

app.route('/auth/', authRoute);

app.use('/account/*', jwt({ secret: (process.env.ACCESS_TOKEN_SECRET as string) }));
app.route('/account', accountRoute);

app.use('/socket/*', jwt({ secret: (process.env.ACCESS_TOKEN_SECRET as string) }));
app.route('/socket', socketRoute);

export default {
  fetch: app.fetch,
  port: process.env.PORT,
}
