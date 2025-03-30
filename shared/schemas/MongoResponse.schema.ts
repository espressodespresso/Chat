import {z} from "zod";

export const MongoResponseSchema = z.object({
    status: z.boolean(),
    result: z.any()
})