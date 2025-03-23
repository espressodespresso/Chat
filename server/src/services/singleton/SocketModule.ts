import {SocketService} from "./SocketService";
import {ISocketService} from "../../interfaces/SocketService.interface";

export const socketServiceInstance: ISocketService = SocketService.getInstance();