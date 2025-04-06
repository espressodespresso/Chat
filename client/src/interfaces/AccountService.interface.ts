import {GenericResponse} from "@shared/types/GenericResponse.types.ts";

export interface IAccountService {
    getAccountDetails(): Promise<GenericResponse>;
    getAccountUsername(user_id: string): Promise<GenericResponse>;
}