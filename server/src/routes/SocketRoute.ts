import {Hono} from "hono";
import {ISocketMessage, ISocketService} from "../services/SocketService";
import {ServiceFactory} from "../services/ServiceFactory";
import {createBunWebSocket} from "hono/bun";
import type {ServerWebSocket} from "bun";
import {JWTPayload} from "hono/dist/types/utils/jwt/types";
import {decode, verify} from "hono/jwt";
import {WSMessageReceive} from "hono/dist/types/helper/websocket";
import {ITokenService} from "../services/TokenService";
import {ELogRequestEvent, ELogRouteEvent} from "../enums/LogEvent.enum";
import {ILogService} from "../services/LogService";

export const socketRoute = new Hono();

const { upgradeWebSocket, websocket } = createBunWebSocket<ServerWebSocket>()
const socketService: ISocketService = ServiceFactory.createSocketService();
const tokenService: ITokenService = ServiceFactory.createTokenService();
const logService: ILogService = ServiceFactory.createLogService();

socketRoute.get('/', upgradeWebSocket(async (c) => {
    const authHeader: string = c.req.header('Authorization') as string;
    let payload: JWTPayload;
    return {
        async onOpen(event, ws) {
            try {
                const socket: ServerWebSocket = ws.raw as ServerWebSocket;
                const token: string = authHeader.split(' ')[1];
                if(await tokenService.verifyAccessToken(token)) {
                    payload = decode(token).payload;
                    const username: string = payload["username"] as string
                    await socketService.addConnection({
                        username: username,
                        socket: socket
                    });

                    await logService.addLog({
                        timestamp: new Date(Date.now()),
                        event: ELogRequestEvent.GET,
                        route: ELogRouteEvent.SOCKET,
                        message: "onOpen",
                        username: username
                    });
                } else {
                    socket.close(1011, "Could not verify token successfully.")
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
                await socketService.sendToUsername(socketMessage);

                await logService.addLog({
                    timestamp: new Date(Date.now()),
                    event: ELogRequestEvent.GET,
                    route: ELogRouteEvent.SOCKET,
                    message: "onMessage",
                    username: socketMessage["senderUsername"]
                });
            } catch (error) {
                console.error(error);
            }
        },

        async onClose(event, ws) {
            try {
                const socket: ServerWebSocket = ws.raw as ServerWebSocket;
                const token: string = authHeader.split(' ')[1];
                if(await tokenService.verifyAccessToken(token)) {
                    payload = decode(token).payload;
                    const username: string = payload["username"] as string;
                    await socketService.removeConnection({
                        username: username,
                        socket: socket
                    });

                    await logService.addLog({
                        timestamp: new Date(Date.now()),
                        event: ELogRequestEvent.GET,
                        route: ELogRouteEvent.SOCKET,
                        message: "onClose",
                        username: username
                    });
                }
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