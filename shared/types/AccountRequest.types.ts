import {z} from "zod";
import {
    UpdateAccountDetailsRequestSchema,
    UpdateAccountOptionsRequestSchema
} from "../schemas/AccountRequest.schema";

export type UpdateAccountDetailsRequest = z.infer<typeof UpdateAccountDetailsRequestSchema>;
export type UpdateAccountOptionsRequest = z.infer<typeof UpdateAccountOptionsRequestSchema>;