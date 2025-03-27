import {z} from "zod";
import {IChatUserSchema} from "./Conversion.schema";

export const FriendAddRemoveRequestSchema = z.object({
    recipient_user: IChatUserSchema
})