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