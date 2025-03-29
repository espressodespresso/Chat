import {z} from "zod";
import {IChatUserSchema, IUserDetailsSchema, IUserOptionsSchema} from "./Conversion.schema";

export const UpdateAccountDetailsRequestSchema = z.object({
    user_data: IUserDetailsSchema
})

export const UpdateAccountOptionsRequestSchema = z.object({
    user: IChatUserSchema,
    data: IUserOptionsSchema
})