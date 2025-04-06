import {z} from "zod";
import {UserDetailsSchema} from "../schemas/UserDetails.schema";

export type UserDetails = z.infer<typeof UserDetailsSchema>;