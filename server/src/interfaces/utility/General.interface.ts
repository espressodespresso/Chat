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