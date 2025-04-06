import {z} from "zod";
import {ChatUserSchema} from "./ChatUser.schema";
import {UserOptionsSchema} from "./UserOptions.schema";

export const UserDetailsSchema = z.object({
    user_id: z.string(),
    username: z.string(),
    password: z.string(),
    email: z.string(),
    chat_list: z.array(z.string()),
    friend_list: z.array(ChatUserSchema),
    blocked_users: z.array(ChatUserSchema),
    last_seen: z.date(),
    online: z.boolean(),
    options: UserOptionsSchema
})