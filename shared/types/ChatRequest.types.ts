import { z } from "zod";
import {
    ChangeChatNameRequestSchema,
    CreateChatRequestSchema,
    DeleteChatRequestSchema,
    UserAddRemoveRequestSchema
} from "../schemas/ChatRequest.schema";

export type CreateChatRequest = z.infer<typeof CreateChatRequestSchema>;
export type ChangeChatNameRequest = z.infer<typeof ChangeChatNameRequestSchema>;
export type UserAddRemoveRequest = z.infer<typeof UserAddRemoveRequestSchema>;
export type DeleteChatRequest = z.infer<typeof DeleteChatRequestSchema>;