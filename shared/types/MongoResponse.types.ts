import { z } from "zod";
import {MongoResponseSchema} from "../schemas/MongoResponse.schema";

export type MongoResponse = z.infer<typeof MongoResponseSchema>;