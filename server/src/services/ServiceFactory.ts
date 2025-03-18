import {MongoService} from "./MongoService";
import {AuthService} from "./AuthService";
import {AccountService} from "./AccountService";
import {TokenService} from "./TokenService";
import {SocketService} from "./SocketService";
import {LogService} from "./LogService";

export class ServiceFactory {
    static createMongoService(): MongoService {
        return new MongoService();
    }

    static createAuthService(): AuthService {
        return new AuthService();
    }

    static createAccountService(): AccountService {
        return new AccountService();
    }

    static createTokenService(): TokenService {
        return new TokenService();
    }

    static createSocketService(): SocketService {
        return new SocketService();
    }

    static createLogService(): LogService {
        return new LogService();
    }
}