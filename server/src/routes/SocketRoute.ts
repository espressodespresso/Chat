import {Hono} from "hono";
import {IUserDetails} from "../services/AuthService";
import {ISocketMessage, ISocketService} from "../services/SocketService";
import {ServiceFactory} from "../services/ServiceFactory";
import {createBunWebSocket} from "hono/dist/types/adapter/bun";
import type {ServerWebSocket} from "bun";
import {JWTPayload} from "hono/dist/types/utils/jwt/types";
import {decode, verify} from "hono/dist/types/middleware/jwt";
import {WSMessageReceive} from "hono/dist/types/helper/websocket";
import {ITokenService} from "../services/TokenService";

export const socketRoute = new Hono();

const { upgradeWebSocket, websocket } = createBunWebSocket<ServerWebSocket>()
const socketService: ISocketService = ServiceFactory.createSocketService();
const tokenService: ITokenService = ServiceFactory.createTokenService();

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
                    socketService.addConnection({
                        username: payload["username"] as string,
                        socket: socket
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
                    socketService.removeConnection({
                        username: payload["username"] as string,
                        socket: socket
                    });
                }
            } catch (error) {
                console.error(error);
            }
        }
    }
}))