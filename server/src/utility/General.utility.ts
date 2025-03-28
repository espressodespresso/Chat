import {ContentfulStatusCode} from "hono/dist/types/utils/http-status";
import {IGeneralUtility, IGenericResponse} from "../interfaces/utility/General.interface";
import {IChatUser} from "../interfaces/ChatService.interface";
import {IMongoService, MongoResponse} from "../interfaces/MongoService.interface";
import {ServiceFactory} from "../services/ServiceFactory";
import {ECollection} from "../enums/Collection.enum";

export class GeneralUtility implements IGeneralUtility {
    private static _instance: GeneralUtility | null = null;
    private _mongoService: IMongoService;

    private constructor() {
        this._mongoService = ServiceFactory.createMongoService();
    }

    static getInstance(): GeneralUtility {
        if(this._instance === null) {
            this._instance = new GeneralUtility();
        }

        return this._instance;
    }

    async generateID(collection: ECollection): Promise<string> {
        let unique: boolean = false;
        let id: string = "";
        while (!unique) {
            const chars: string =  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            for (let i = 0; i < 21; i++) {
                id += chars.charAt(Math.floor(Math.random() * chars.length));
            }

            const response: MongoResponse = await this._mongoService.handleConnection
            (async (): Promise<MongoResponse> => {
                switch (collection) {
                    case ECollection.chats:
                        const chatQuery = { chat_id: id }
                        return await this._mongoService.findOne(chatQuery, ECollection.chats);
                    case ECollection.logs:
                        const logsQuery = { log_id: id }
                        return await this._mongoService.findOne(logsQuery, ECollection.logs);
                    case ECollection.users:
                        const userQuery = { user_id: id }
                        return await this._mongoService.findOne(userQuery, ECollection.users);
                    default:
                        return this._mongoService.objResponse(false, null);
                }
            })

            if(!response["status"]) {
                unique = true;
            }
        }

        return id;
    }

    genericResponse(status: boolean, result: any, code?: ContentfulStatusCode): IGenericResponse {
        if(code) {
            return {
                status: status,
                result: result,
                code: code
            }
        }

        return {
            status: status,
            result: result
        }
    }

    verifyUserAccess(request_username: IChatUser, recipient_username: IChatUser): boolean {
        return request_username !== recipient_username;
    }

    noUserAccessString(): string {
        return "You cannot access this route due to not have the correct privileges.";
    }

    deleteUserInArray(recipient_user: IChatUser, array: IChatUser[]): IChatUser[] {
        for(let i = 0; i < array.length; i++) {
            const user: IChatUser = array[i];
            if(user["user_id"] === recipient_user["user_id"]) {
                array.splice(i, 1);
                break;
            }
        }

        return array;
    }
}