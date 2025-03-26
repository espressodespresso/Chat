import {MongoService} from "./MongoService";
import {AuthService} from "./AuthService";
import {AccountService} from "./AccountService";
import {TokenService} from "./TokenService";
import {LogService} from "./LogService";
import {FriendService} from "./FriendService";
import {ChatService} from "./ChatService";

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

    static createLogService(): LogService {
        return new LogService();
    }

    static createFriendService(): FriendService {
        return new FriendService();
    }

    static createChatService(): ChatService {
        return new ChatService();
    }
}