import { z } from "zod";
import {
    LoginRequestSchema,
    LogoutRequestSchema,
    RefreshRequestSchema,
    SignupRequestSchema
} from "../schemas/AuthRequest.schema";

export type LogoutRequest = z.infer<typeof LogoutRequestSchema>;
export type RefreshRequest = z.infer<typeof RefreshRequestSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type SignupRequest = z.infer<typeof SignupRequestSchema>;