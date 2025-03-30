import {z} from "zod";

export const GenericResponseSchema = z.object({
    status: z.boolean(),
    result: z.any(),
    code: z.number().optional()
})