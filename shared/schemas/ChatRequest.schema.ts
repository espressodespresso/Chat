import {z} from "zod";
import {IChatUserSchema} from "./Conversion.schema";

export const CreateChatRequestSchema = z.object({
    chat_name: z.string(),
    users: z.array(IChatUserSchema)
})

export const ChangeChatNameRequestSchema = z.object({
    chat_id: z.string(),
    new_name: z.string()
})

export const UserAddRemoveRequestSchema = z.object({
    chat_id: z.string(),
    recipient_user: IChatUserSchema
})

export const DeleteChatRequestSchema = z.object({
    chat_id: z.string()
})