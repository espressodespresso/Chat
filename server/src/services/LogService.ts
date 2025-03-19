import {IMongoService, MongoResponse} from "./MongoService";
import {ServiceFactory} from "./ServiceFactory";
import {ELogEvent} from "../enums/LogEvent.enum";
import {ECollection} from "../enums/Collection.enum";
import {IGeneralUtility} from "../utility/General.utility";
import {generalUtility} from "../utility/UtilityModule";

export interface ILogService {
    addLog(data: ILogData): Promise<boolean>;
}

export interface ILogData {
    log_id?: string,
    timestamp: Date,
    event: ELogEvent,
    username: string,
    message?: string,
    recipient_username?: string,
}

export class LogService implements ILogService {
    private _mongoService: IMongoService;
    private _generalUtility: IGeneralUtility;

    constructor() {
        this._mongoService = ServiceFactory.createMongoService();
        this._generalUtility = generalUtility;
    }

    async addLog(data: ILogData): Promise<boolean> {
        data["log_id"] = this._generalUtility.generateID();
        const response: MongoResponse = await this._mongoService.handleConnection
        (async (): Promise<MongoResponse> => {
            return await this._mongoService.insertOne(data, ECollection.logs);
        })

        return response["status"];
    }
}