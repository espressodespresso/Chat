import { z } from "zod";
import {TokenPayloadSchema} from "../schemas/TokenPayload.schema";

export type TokenPayload = z.infer<typeof TokenPayloadSchema>;