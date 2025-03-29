import {z} from "zod";

export const GenericResponseSchema = z.object({
    status: z.string(),
    result: z.any(),
    code: z.number().optional()
})