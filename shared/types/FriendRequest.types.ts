import { z } from "zod";
import {FriendAddRemoveRequestSchema} from "../schemas/FriendRequest.schema";

export type FriendAddRemoveRequest = z.infer<typeof FriendAddRemoveRequestSchema>;