import {IMongoService, MongoResponse} from "./MongoService";
import {ServiceFactory} from "./ServiceFactory";
import {ELogEvent} from "../enums/LogEvent.enum";
import {ECollection} from "../enums/Collection.enum";

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

    constructor() {
        this._mongoService = ServiceFactory.createMongoService();
    }

    private generateLogID(): string {
        const chars: string =  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let log_id: string = "";
        for (let i = 0; i < 25; i++) {
            log_id = chars.charAt(Math.floor(Math.random() * chars.length));
        }

        return log_id;
    }

    async addLog(data: ILogData): Promise<boolean> {
        data["log_id"] = this.generateLogID();
        const response: MongoResponse = await this._mongoService.handleConnection
        (async (): Promise<MongoResponse> => {
            return await this._mongoService.insertOne(data, ECollection.logs);
        })

        return response["status"];
    }
}