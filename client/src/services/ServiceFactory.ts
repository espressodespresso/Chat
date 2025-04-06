import {FetchService} from "./FetchService.ts";
import {AccountService} from "./AccountService.ts";

export class ServiceFactory {
    static createFetchService(): FetchService {
        return new FetchService();
    }

    static createAccountService(): AccountService {
        return new AccountService();
    }
}