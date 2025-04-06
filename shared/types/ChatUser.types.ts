import {z} from "zod";
import {ChatUserSchema} from "../schemas/ChatUser.schema";

export type ChatUser = z.infer<typeof ChatUserSchema>;