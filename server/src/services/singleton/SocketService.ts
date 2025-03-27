import {ServiceFactory} from "../ServiceFactory";
import {ECollection} from "../../enums/Collection.enum";
import {ServerWebSocket} from "bun";
import {ELogServiceEvent} from "../../enums/LogEvent.enum";
import {ISocketDataUpdate, ISocketMessage, ISocketService, IUserSocket} from "../../interfaces/SocketService.interface";
import {IMongoService, MongoResponse} from "../../interfaces/MongoService.interface";
import {ILogService} from "../../interfaces/LogService.interface";
import {IUserDetails} from "../../interfaces/AccountService.interface";
import {ESocketEvent} from "../../enums/SocketEvent.enum";

export class SocketService implements ISocketService {
    private static _instance: SocketService | null = null;
    private _activeConnections: Map<string, ServerWebSocket>;
    private _mongoService: IMongoService;
    private _textEncoder: TextEncoder;
    private _logService: ILogService;

    private constructor() {
        this._activeConnections = new Map<string, ServerWebSocket>();
        this._textEncoder = new TextEncoder();
        this._mongoService = null as any;
        this._logService = null as any;

        setTimeout(() => {
            this._mongoService = ServiceFactory.createMongoService();
            this._logService = ServiceFactory.createLogService();
        }, 0);
    }

    static getInstance(): SocketService {
        if(this._instance === null) {
            this._instance = new SocketService();
        }

        return this._instance;
    }

    async addConnection(client: IUserSocket): Promise<string> {
        const user_id: string = client["user_id"];
        this._activeConnections.set(user_id, client["socket"]);
        await this._logService.addLog({
            timestamp: new Date(Date.now()),
            event: ELogServiceEvent.SOCKET_OPENED,
            user_id: user_id
        });
        return `${user_id} connected...`
    }

    async removeConnection(client: IUserSocket): Promise<string> {
        const user_id: string = client["user_id"];
        this._activeConnections.delete(user_id);
        await this._logService.addLog({
            timestamp: new Date(Date.now()),
            event: ELogServiceEvent.SOCKET_CLOSE,
            user_id: user_id
        });
        return `${user_id} disconnected...`;
    }

    async getConnection(user_id: string): Promise<IUserSocket | null> {
        const connection: ServerWebSocket | undefined = this._activeConnections.get(user_id);
        if (!connection) {
            return null;
        }

        return {
            user_id: user_id,
            socket: connection
        }
    }

    private queryActiveConnection(user_id: string): boolean {
        return this._activeConnections.has(user_id);
    }

    async sendToAllActive(message: ISocketMessage): Promise<boolean> {
        const sockets: ServerWebSocket[] = this._activeConnections.values().toArray();
        const userIDs: string[] = this._activeConnections.keys().toArray();
        let messageData: ISocketMessage[] = [];

        for(let i = 0; i < this._activeConnections.size; i++) {
            const socket: ServerWebSocket = sockets[i];
            const user_id: string = userIDs[i];
            if(socket.readyState === 1) {
                const data: ISocketMessage = {
                    recipient_id: user_id,
                    sender_id: "Server",
                    message: message["message"],
                    timestamp: new Date(Date.now()),
                };

                socket.sendBinary(this._textEncoder.encode(JSON.stringify(data)));
                messageData.push(data);
            } else {
                console.log(`Skipped broadcasting to ${user_id}'s socket as busy.`)
            }
        }

        await this._logService.addLog({
            timestamp: new Date(Date.now()),
            event: ELogServiceEvent.SOCKET_MESSAGE,
            user_id: "Server",
            recipient_id: "All"
        });

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
                    if(activeUsers.includes(user["user_id"])) {
                        continue;
                    }

                    const data: ISocketMessage = {
                        recipient_id: user["user_id"],
                        sender_id: "Server",
                        message: message["message"],
                        timestamp: new Date(Date.now()),
                    }

                    messageData.push(data);
                }

                return await this._mongoService.insertMany(messageData, ECollection.messages);
            }

            return this._mongoService.objResponse(false, "Unable to find all users.");
        })

        await this._logService.addLog({
            timestamp: new Date(Date.now()),
            event: ELogServiceEvent.SOCKET_MESSAGE,
            user_id: "Server",
            recipient_id: "All"
        });

       return response["status"];
    }

    async sendToActiveUserID(message: ISocketMessage): Promise<boolean> {
        const recipientID: string = message["recipient_id"];
        if(this.queryActiveConnection(recipientID)) {
            const userSocket: ServerWebSocket = this._activeConnections.get(recipientID) as ServerWebSocket;
            if(userSocket.readyState === 1) {
                userSocket.sendBinary(this._textEncoder.encode(JSON.stringify(message)));
                await this._logService.addLog({
                    timestamp: new Date(Date.now()),
                    event: ELogServiceEvent.SOCKET_MESSAGE,
                    user_id: message["sender_id"],
                    recipient_id: recipientID
                });
                return true;
            }

            console.log(`Skipped broadcasting to ${recipientID}'s socket as busy.`)
        }

        return false;
    }

    async sendToUserID(message: ISocketMessage): Promise<boolean> {
        if(!await this.sendToActiveUserID(message)) {
            const response: MongoResponse = await this._mongoService.handleConnection
            (async (): Promise<MongoResponse> => {
                return await this._mongoService.insertOne(message, ECollection.messages);
            })

            return response["status"];
        }

        return true;
    }

    createSocketMessage(recipient_id: string, sender_id: string, message: string): ISocketMessage {
        return {
            recipient_id: recipient_id,
            sender_id: sender_id,
            message: {
                event: ESocketEvent.MESSAGE,
                data: {
                    message: message
                }
            },
            timestamp: new Date(Date.now())
        }
    }

    createSocketMessageUpdate(recipient_id: string, sender_id: string, data: ISocketDataUpdate): ISocketMessage {
        return {
            recipient_id: recipient_id,
            sender_id: sender_id,
            message: {
                event: ESocketEvent.DATA_UPDATE,
                data: data
            },
            timestamp: new Date(Date.now())
        }
    }
}