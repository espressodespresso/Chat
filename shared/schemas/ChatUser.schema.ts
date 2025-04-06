import {z} from "zod";

export const ChatUserSchema = z.object({
    user_id: z.string()
})