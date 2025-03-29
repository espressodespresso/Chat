import {z} from "zod";

export const LogoutRequestSchema = z.object({
    refresh_token: z.string()
})

export const RefreshRequestSchema = z.object({
    refresh_token: z.string()
})

export const LoginRequestSchema = z.object({
    username: z.string(),
    password: z.string()
})

export const SignupRequestSchema = z.object({
    username: z.string(),
    password: z.string(),
    email: z.string()
})