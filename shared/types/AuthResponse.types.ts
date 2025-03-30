import { z } from "zod";
import {AuthResponseSchema} from "../schemas/AuthResponse.schema";

export type AuthResponse = z.infer<typeof AuthResponseSchema>