import {z} from "zod";
import {UserOptionsSchema} from "../schemas/UserOptions.schema";

export type UserOptions = z.infer<typeof UserOptionsSchema>;