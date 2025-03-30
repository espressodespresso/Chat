import {z} from "zod";
import {TokenPayloadSchema} from "./TokenPayload.schema";

export const AuthResponseSchema = z.object({
    status: z.boolean(),
    message: z.string(),
    code: z.number(),
    token: TokenPayloadSchema.optional()
})