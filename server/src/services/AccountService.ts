import {IMongoService} from "./MongoService";
import {ServiceFactory} from "./ServiceFactory";

export interface IAccountService {

}

export class AccountService implements IAccountService {
    private _mongoService: IMongoService;

    constructor() {
        this._mongoService = ServiceFactory.createMongoService();
    }


}