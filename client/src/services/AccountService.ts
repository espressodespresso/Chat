import {IAccountService} from "../interfaces/AccountService.interface.ts";
import {IFetchService} from "../interfaces/FetchService.interface.ts";
import {ServiceFactory} from "./ServiceFactory.ts";
import {GenericResponse} from "@shared/types/GenericResponse.types.ts";
import {EFetchMethod} from "../enums/FetchMethod.enum.ts";

export class AccountService implements IAccountService {
    private _fetchService: IFetchService;

    constructor() {
        this._fetchService = ServiceFactory.createFetchService();
    }

    async getAccountDetails(): Promise<GenericResponse> {
        return await this._fetchService.request(EFetchMethod.GET, "/account/accountDetails");
    }

    async getAccountUsername(user_id: string): Promise<GenericResponse> {
        return await this._fetchService.request(EFetchMethod.GET, `/account/getUsername?user_id=${user_id}`);
    }
}