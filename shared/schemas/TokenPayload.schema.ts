import {z} from "zod";
import {MongoResponseSchema} from "./MongoResponse.schema";

export const TokenPayloadSchema = z.object({
    access_token: z.string().optional(),
    refresh_token: z.string().optional(),
    response: MongoResponseSchema.optional(),
    code: z.number().optional(),
    user_id: z.string().optional(),
})