import {IMongoService, MongoResponse} from "./MongoService";
import {ServiceFactory} from "./ServiceFactory";
import {ECollection} from "../enums/Collection.enum";
import {IUserDetails} from "./AuthService";

export interface ISocketService {
    addConnection(client: IUserSocket): string;
    removeConnection(client: IUserSocket): string;
    sendToAllActive(message: string): void;
    sendToAll(message: string): Promise<boolean>
    sendToUsername(username: string, message: string): Promise<boolean>;
}

export interface IUserSocket {
    username: string;
    socket: WebSocket;
}

export interface ISocketMessage {
    recipientUsername: string;
    senderUsername: string;
    message: string;
    timestamp: Date;
}

export class SocketService implements ISocketService {
    private _activeConnections: Map<string, WebSocket>;
    private _mongoService: IMongoService;

    constructor() {
        this._activeConnections = new Map<string, WebSocket>();
        this._mongoService = ServiceFactory.createMongoService();
    }

    addConnection(client: IUserSocket): string {
        this._activeConnections.set(client["username"], client["socket"]);
        return `${client["username"]} connected...`
    }

    removeConnection(client: IUserSocket): string {
        this._activeConnections.delete(client["username"]);
        return `${client["username"]} disconnected...`;
    }

    sendToAllActive(message: string): void {
        const sockets: WebSocket[] = this._activeConnections.values().toArray();
        for(let i = 0; i < this._activeConnections.size; i++) {
            const socket: WebSocket = sockets[i];
            if(socket.readyState === WebSocket.OPEN) {
                socket.send(message);
            } else {
                console.log("Skipped socket as busy.")
            }
        }
    }

    async sendToAll(message: string): Promise<boolean> {
        this.sendToAllActive(message);
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
                        message: message,
                        timestamp: new Date(Date.now()),
                    }

                    messageData.push(data);
                }

                return await this._mongoService.insertMany(messageData, ECollection.offline_messages)
            }

            return this._mongoService.objResponse(false, "Unable to find all users.");
        })

       return response["status"];
    }

    async sendToUsername(username: string, message: string): Promise<boolean> {
        const userSocket: WebSocket = this._activeConnections.get(username) as WebSocket;
        if(userSocket.readyState === WebSocket.OPEN) {
            userSocket.send(message);
            return true;
        }

        console.log("Skipped username socket as busy.")
        return false;
    }


}