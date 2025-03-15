import { Hono } from 'hono'
import { cors } from 'hono/cors'
import 'dotenv/config';
import {authRoute} from "./routes/AuthRoute";

const app = new Hono()

app.route('/auth/', authRoute)

export default {
  fetch: app.fetch,
  port: process.env.PORT,
}
