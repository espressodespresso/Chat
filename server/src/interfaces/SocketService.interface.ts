import {ServerWebSocket} from "bun";

export interface ISocketService {
    addConnection(client: IUserSocket): Promise<string>;
    removeConnection(client: IUserSocket): Promise<string>;
    getConnection(username: string): Promise<IUserSocket | null>;
    sendToAllActive(message: ISocketMessage): void;
    sendToAll(message: ISocketMessage): Promise<boolean>
    sendToUsername(message: ISocketMessage): Promise<boolean>;
}

export interface IUserSocket {
    username: string;
    socket: ServerWebSocket;
}

export interface ISocketMessage {
    recipientUsername: string;
    senderUsername: string;
    message: string;
    timestamp: Date;
}