import {ContentfulStatusCode} from "hono/dist/types/utils/http-status";
import {IChatUser} from "../ChatService.interface";

export interface IGeneralUtility {
    generateID(): string;
    genericResponse(status: boolean, result: any, code?: ContentfulStatusCode): IGenericResponse;
    verifyUserAccess(request_username: IChatUser, recipient_username: IChatUser): boolean;
    noUserAccessString(): string;
    deleteUserInArray(recipient_user: IChatUser, array: IChatUser[]): IChatUser[];
}

export interface IGenericResponse {
    status: boolean;
    result: any;
    code?: ContentfulStatusCode;
}