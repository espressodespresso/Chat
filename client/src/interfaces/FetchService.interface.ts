import {GenericResponse} from "@shared/types/GenericResponse.types.ts";
import {EFetchMethod} from "../enums/FetchMethod.enum.ts";
import {AuthResponse} from "@shared/types/AuthResponse.types.ts";

export interface IFetchService {
    request(fetchMethod: EFetchMethod, route: string, body?: JSON): Promise<GenericResponse | AuthResponse>;
}