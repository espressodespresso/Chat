import {Hono} from "hono";
import {ServiceFactory} from "../services/ServiceFactory";
import {createBunWebSocket} from "hono/bun";
import type {ServerWebSocket} from "bun";
import {JWTPayload} from "hono/dist/types/utils/jwt/types";
import {decode} from "hono/jwt";
import {ELogRequestEvent, ELogRouteEvent} from "../enums/LogEvent.enum";
import {socketServiceInstance} from "../services/singleton/SocketModule";
import {ISocketMessage, ISocketService, IUserSocket} from "../interfaces/SocketService.interface";
import {ITokenService} from "../interfaces/TokenService.interface";
import {ILogService} from "../interfaces/LogService.interface";

export const socketRoute = new Hono();

const { upgradeWebSocket, websocket } = createBunWebSocket<ServerWebSocket>()
const socketService: ISocketService = socketServiceInstance;
const tokenService: ITokenService = ServiceFactory.createTokenService();
const logService: ILogService = ServiceFactory.createLogService();

const SocketRouteMessages = {
    NO_TOKEN_QUERY: "Token not provided as a query.",
    INVALID_TOKEN: "Could not verify token successfully.",
    NO_USERID_QUERY: "Unable to properly close user as user ID is not provided as a query.",
    NO_ACTIVE_CONNECTION: "Unable to properly close user as unable to locate active connection."
}

socketRoute.get('/', upgradeWebSocket(async (c) => {
    let payload: JWTPayload;
    return {
        async onOpen(event, ws) {
            try {
                const socket: ServerWebSocket = ws.raw as ServerWebSocket;
                const queriedToken: string | undefined = c.req.query('token');
                let token: string;
                if(!queriedToken) {
                    socket.close(1011, SocketRouteMessages.NO_TOKEN_QUERY);
                }
                token = queriedToken as string;
                if(await tokenService.verifyAccessToken(token)) {
                    payload = decode(token)["payload"];
                    const user_id: string = payload["user_id"] as string
                    await socketService.addConnection({
                        user_id: user_id,
                        socket: socket
                    });

                    await logService.addLog({
                        timestamp: new Date(Date.now()),
                        event: ELogRequestEvent.GET,
                        route: ELogRouteEvent.SOCKET,
                        message: "onOpen",
                        user_id: user_id
                    });
                } else {
                    socket.close(1011, SocketRouteMessages.INVALID_TOKEN)
                }
            } catch (error) {
                console.error(error);
            }
        },

        async onMessage(event, ws) {
            try {
                const socketMessageString: string = ((event.data instanceof Uint8Array ? new TextDecoder().decode(event.data)
                    : event.data) as string);
                const socketMessage: ISocketMessage = JSON.parse(socketMessageString);
                await socketService.sendToUserID(socketMessage);

                await logService.addLog({
                    timestamp: new Date(Date.now()),
                    event: ELogRequestEvent.GET,
                    route: ELogRouteEvent.SOCKET,
                    message: "onMessage",
                    user_id: socketMessage["sender_id"]
                });
            } catch (error) {
                console.error(error);
            }
        },

        async onClose(event, ws) {
            try {
                const socket: ServerWebSocket = ws.raw as ServerWebSocket;
                const queriedUserID: string | undefined = c.req.query('user_id');
                if (!queriedUserID) {
                    console.error(SocketRouteMessages.NO_USERID_QUERY);
                }

                const user_id: string = queriedUserID as string;
                const connection: IUserSocket | null = await socketService.getConnection(user_id);
                if(connection === null) {
                    console.error(SocketRouteMessages.NO_ACTIVE_CONNECTION);
                }

                await socketService.removeConnection(connection as IUserSocket);
                await logService.addLog({
                    timestamp: new Date(Date.now()),
                    event: ELogRequestEvent.GET,
                    route: ELogRouteEvent.SOCKET,
                    message: "onClose",
                    user_id: user_id
                });
            } catch (error) {
                console.error(error);
            }
        },

        async onError(event, ws) {
            console.error(`Socket Error: ${event.type}`);
            await logService.addLog({
                timestamp: new Date(Date.now()),
                event: ELogRequestEvent.GET,
                route: ELogRouteEvent.SOCKET,
                message: `onError ${event.type}`
            });
        }
    }
}))