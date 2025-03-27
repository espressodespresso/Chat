import {ServerWebSocket} from "bun";
import {ESocketEvent, ESocketUpdateEvent, ESocketUpdateEventType} from "../enums/SocketEvent.enum";
import {IGenericResponse} from "./utility/General.interface";

export interface ISocketService {
    addConnection(client: IUserSocket): Promise<string>;
    removeConnection(client: IUserSocket): Promise<string>;
    getConnection(user_id: string): Promise<IUserSocket | null>;
    sendToAllActive(message: ISocketMessage): void;
    sendToAll(message: ISocketMessage): Promise<boolean>;
    sendToActiveUserID(message: ISocketMessage): Promise<boolean>;
    sendToUserID(message: ISocketMessage): Promise<boolean>;
    createSocketMessage(recipient_id: string, sender_id: string, message: string): ISocketMessage;
    createSocketMessageUpdate(recipient_id: string, sender_id: string, data: ISocketDataUpdate): ISocketMessage;
}

export interface IUserSocket {
    user_id: string;
    socket: ServerWebSocket;
}

export interface ISocketMessage {
    recipient_id: string;
    sender_id: string;
    message: ISocketData;
    timestamp: Date;
}

export interface ISocketData {
    event: ESocketEvent,
    data: ISocketMessageData | ISocketDataUpdate
}

export interface ISocketMessageData {
    message: string;
}

export interface ISocketDataUpdate {
    event: ESocketUpdateEvent,
    type: ESocketUpdateEventType,
    id: string
}