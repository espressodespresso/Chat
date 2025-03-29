import {IAuthService} from "../../interfaces/AuthService.interface.js";
import {AuthService} from "./AuthService.js";

export const authServiceInstance: IAuthService = AuthService.getInstance();