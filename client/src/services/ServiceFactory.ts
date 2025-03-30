import {FetchService} from "./FetchService.ts";

export class ServiceFactory {
    static createFetchService(): FetchService {
        return new FetchService();
    }
}