import {MongoService} from "./MongoService";
import {AuthService} from "./AuthService";

export class ServiceFactory {
    static createMongoService(): MongoService {
        return new MongoService();
    }

    static createAuthService(): AuthService {
        return new AuthService();
    }
}