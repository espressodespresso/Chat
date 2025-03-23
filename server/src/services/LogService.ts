import {IMongoService, MongoResponse} from "./MongoService";
import {ServiceFactory} from "./ServiceFactory";
import {ECollection} from "../enums/Collection.enum";
import {IGeneralUtility} from "../utility/General.utility";
import {generalUtilityInstance} from "../utility/UtilityModule";
import {ELogRequestEvent, ELogRouteEvent, ELogServiceEvent} from "../enums/LogEvent.enum";
import {ContentfulStatusCode} from "hono/dist/types/utils/http-status";

export interface ILogService {
    addLog(data: ILogData): Promise<boolean>;
}

export interface ILogData {
    log_id?: string,
    timestamp: Date,
    event: ELogServiceEvent | ELogRequestEvent,
    route?: ELogRouteEvent,
    username?: string,
    message?: string,
    recipient_username?: string,
    status_code?: ContentfulStatusCode
}

export class LogService implements ILogService {
    private _mongoService: IMongoService;
    private _generalUtility: IGeneralUtility;

    constructor() {
        this._mongoService = ServiceFactory.createMongoService();
        this._generalUtility = generalUtilityInstance;
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