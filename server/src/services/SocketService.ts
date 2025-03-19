import {IMongoService, MongoResponse} from "./MongoService";
import {ServiceFactory} from "./ServiceFactory";
import {ECollection} from "../enums/Collection.enum";
import {IUserDetails} from "./AuthService";
import {ServerWebSocket} from "bun";

export interface ISocketService {
    addConnection(client: IUserSocket): string;
    removeConnection(client: IUserSocket): string;
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

export class SocketService implements ISocketService {
    private _activeConnections: Map<string, ServerWebSocket>;
    private _mongoService: IMongoService;
    private _textEncoder: TextEncoder;

    constructor() {
        this._activeConnections = new Map<string, ServerWebSocket>();
        this._mongoService = ServiceFactory.createMongoService();
        this._textEncoder = new TextEncoder();
    }

    addConnection(client: IUserSocket): string {
        this._activeConnections.set(client["username"], client["socket"]);
        return `${client["username"]} connected...`
    }

    removeConnection(client: IUserSocket): string {
        this._activeConnections.delete(client["username"]);
        return `${client["username"]} disconnected...`;
    }

    private queryActiveConnection(username: string): boolean {
        return this._activeConnections.has(username);
    }

    async sendToAllActive(message: ISocketMessage): Promise<boolean> {
        const sockets: ServerWebSocket[] = this._activeConnections.values().toArray();
        const usernames: string[] = this._activeConnections.keys().toArray();
        let messageData: ISocketMessage[] = [];

        for(let i = 0; i < this._activeConnections.size; i++) {
            const socket: ServerWebSocket = sockets[i];
            const username: string = usernames[i];
            if(socket.readyState === 1) {
                const data: ISocketMessage = {
                    recipientUsername: username,
                    senderUsername: "Server",
                    message: message["message"],
                    timestamp: new Date(Date.now()),
                };

                socket.sendBinary(this._textEncoder.encode(JSON.stringify(data)));
                messageData.push(data);
            } else {
                console.log(`Skipped broadcasting to ${username}'s socket as busy.`)
            }
        }

        const response: MongoResponse = await this._mongoService.handleConnection
        (async (): Promise<MongoResponse> => {
            return await this._mongoService.insertMany(messageData, ECollection.messages);
        })

        return response["status"];
    }

    async sendToAll(message: ISocketMessage): Promise<boolean> {
        await this.sendToAllActive(message);
        const activeUsers: string[] = this._activeConnections.keys().toArray();
        const response: MongoResponse = await this._mongoService.handleConnection
        (async (): Promise<MongoResponse> => {
            const findAllResponse: MongoResponse = await this._mongoService.findall(ECollection.users);
            if(findAllResponse["status"]) {
                const usersDatabase: IUserDetails[] = findAllResponse["result"];
                let messageData: ISocketMessage[] = [];

                for (let i = 0; i < usersDatabase.length; i++) {
                    const user: IUserDetails = usersDatabase[i];
                    if(activeUsers.includes(user["username"])) {
                        continue;
                    }

                    const data: ISocketMessage = {
                        recipientUsername: user["username"],
                        senderUsername: "Server",
                        message: message["message"],
                        timestamp: new Date(Date.now()),
                    }

                    messageData.push(data);
                }

                return await this._mongoService.insertMany(messageData, ECollection.messages);
            }

            return this._mongoService.objResponse(false, "Unable to find all users.");
        })

       return response["status"];
    }

    async sendToUsername(message: ISocketMessage): Promise<boolean> {
        const recipientUsername: string = message["recipientUsername"];
        if(this.queryActiveConnection(recipientUsername)) {
            const userSocket: ServerWebSocket = this._activeConnections.get(recipientUsername) as ServerWebSocket;
            if(userSocket.readyState === 1) {
                userSocket.sendBinary(this._textEncoder.encode(JSON.stringify(message)));
                return true;
            }

            console.log(`Skipped broadcasting to ${recipientUsername}'s socket as busy.`)
        }

        const response: MongoResponse = await this._mongoService.handleConnection
        (async (): Promise<MongoResponse> => {
            const query = { username: recipientUsername };
            return await this._mongoService.insertOne(message, ECollection.messages);
        })

        return response["status"];
    }
}