import {ServiceFactory} from "./ServiceFactory";
import {ECollection} from "../enums/Collection.enum";
import {generalUtilityInstance} from "../utility/UtilityModule";
import {ILogData, ILogService} from "../interfaces/LogService.interface";
import {IMongoService, MongoResponse} from "../interfaces/MongoService.interface";
import {IGeneralUtility} from "../interfaces/utility/General.interface";

export class LogService implements ILogService {
    private _mongoService: IMongoService;
    private _generalUtility: IGeneralUtility;

    constructor() {
        this._mongoService = ServiceFactory.createMongoService();
        this._generalUtility = generalUtilityInstance;
    }

    async addLog(data: ILogData): Promise<boolean> {
        data["log_id"] = this._generalUtility.generateID();
        /*const response: MongoResponse = await this._mongoService.handleConnection
        (async (): Promise<MongoResponse> => {
            return await this._mongoService.insertOne(data, ECollection.logs);
        })

        return response["status"];*/
        return true;
    }


}