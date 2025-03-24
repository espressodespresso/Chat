import {ContentfulStatusCode} from "hono/dist/types/utils/http-status";
import {IGeneralUtility, IGenericResponse} from "../interfaces/utility/General.interface";
import {IChatUser} from "../interfaces/ChatService.interface";

export class GeneralUtility implements IGeneralUtility {
    private static _instance: GeneralUtility | null = null;

    private constructor() {}

    static getInstance(): GeneralUtility {
        if(this._instance === null) {
            this._instance = new GeneralUtility();
        }

        return this._instance;
    }

    generateID(): string {
        const chars: string =  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let id: string = "";
        for (let i = 0; i < 51; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        return id;
    }

    genericResponse(status: boolean, result: any, code?: ContentfulStatusCode): IGenericResponse {
        if(code) {
            return {
                status: status,
                result: result,
                code: code
            }
        }

        return {
            status: status,
            result: result
        }
    }

    verifyUserAccess(request_username: IChatUser, recipient_username: IChatUser): boolean {
        return request_username !== recipient_username;
    }

    noUserAccessString(): string {
        return "You cannot access this route due to not have the correct privileges.";
    }
}