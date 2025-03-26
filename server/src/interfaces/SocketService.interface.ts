import {ServerWebSocket} from "bun";

export interface ISocketService {
    addConnection(client: IUserSocket): Promise<string>;
    removeConnection(client: IUserSocket): Promise<string>;
    getConnection(user_id: string): Promise<IUserSocket | null>;
    sendToAllActive(message: ISocketMessage): void;
    sendToAll(message: ISocketMessage): Promise<boolean>
    sendToUserID(message: ISocketMessage): Promise<boolean>;
}

export interface IUserSocket {
    user_id: string;
    socket: ServerWebSocket;
}

export interface ISocketMessage {
    recipient_id: string;
    sender_id: string;
    message: string;
    timestamp: Date;
}