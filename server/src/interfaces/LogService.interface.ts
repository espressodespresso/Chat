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
    user_id?: string,
    message?: string,
    recipient_id?: string,
    status_code?: ContentfulStatusCode
}