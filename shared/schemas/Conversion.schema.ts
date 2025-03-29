import { z } from "zod";

export const IChatUserSchema = z.object({
    user_id: z.string()
})

export const IUserOptionsSchema = z.object({
    theme: z.boolean(),
    display_name: z.string()
})

export const IUserDetailsSchema = z.object({
    user_id: z.string(),
    username: z.string(),
    password: z.string(),
    email: z.string(),
    chat_list: z.array(z.string()),
    friend_list: z.array(IChatUserSchema),
    blocked_users: z.array(IChatUserSchema),
    last_seen: z.date(),
    online: z.boolean(),
    options: IUserOptionsSchema
})