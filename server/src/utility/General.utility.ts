import {ContentfulStatusCode} from "hono/dist/types/utils/http-status";

export interface IGeneralUtility {
    generateID(): string;
    genericResponse(status: boolean, result: any, code?: ContentfulStatusCode): IGenericResponse;
}

export interface IGenericResponse {
    status: boolean;
    result: any;
    code?: ContentfulStatusCode;
}

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
}