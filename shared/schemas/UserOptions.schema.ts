import {z} from "zod";

export const UserOptionsSchema = z.object({
    theme: z.boolean(),
    display_name: z.string()
})