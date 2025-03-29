import { z } from "zod";
import {GenericResponseSchema} from "../schemas/GenericResponse.schema";

export type GenericResponse = z.infer<typeof GenericResponseSchema>;