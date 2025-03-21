import {IMongoService, MongoResponse} from "./MongoService";
import {ServiceFactory} from "./ServiceFactory";
import {IGeneralUtility, IGenericResponse} from "../utility/General.utility";
import {generalUtility} from "../utility/UtilityModule";
import {ECollection} from "../enums/Collection.enum";

export interface IChatDetails {
    chat_id: string;
    chat_name: string;
    users: IChatUser[];
    admin: IChatUser[];
    author: IChatUser;
    date_added: Date;
}

export interface IChatUser {
    user_id: string;
    username: string;
}

export interface IChatService {

}

const ChatServiceMessages = {
    CREATION_FAILURE: "Unable to create the chat.",
    CREATION_ADDUSER_FAILURE: "Unable to add all users to the chat.",
    CREATION_UPDATEUSER_FALIURE: "Unable to update all users chat lists.",
    CREATION_SUCCESS: "Successfully created the chat.",
    NO_CHAT_WITH_ID: "Unable to find the chat with the provided ID",
    USER_NOT_ADMIN: "Unable to update details as you don't have permission to.",
    UPDATE_NAME_SUCCESS: "Successfully updated the chat name.",
    UPDATE_NAME_FAILURE: "Unable to update the chat name.",
    USER_NOT_IN_CHAT: "Unable to locate user within that chat.",
    USER_ALREADY_IN_CHAT: "Unable to add user within that chat as they already exist.",
    ADD_USER_SUCCESS: "Successfully added user to the chat.",
    ADD_USER_FAILURE: "Unable to add user within that chat.",
    CANNOT_ADD_YOURSELF: "Unable to add yourself to the chat.",
    ADD_ADMIN_SUCCESS: "Successfully added admin to the chat.",
    ADD_ADMIN_FAILURE: "Unable to add user within that chat.",
    CANNOT_REMOVE_YOURSELF: "Unable to remove yourself from the chat"
}

export class ChatService implements IChatService {
    private _mongoService: IMongoService;
    private _generalUtility: IGeneralUtility;

    constructor() {
        this._mongoService = ServiceFactory.createMongoService();
        this._generalUtility = generalUtility;
    }

    async createChat(chat_name: string, creator_user: IChatUser, users: IChatUser[]): Promise<IGenericResponse> {
        const defaultData: IChatDetails = {
            chat_id: this._generalUtility.generateID(),
            chat_name: chat_name,
            users: users,
            admin: [],
            author: creator_user,
            date_added: new Date(Date.now())
        }

        await this._mongoService.handleConnection
        (async (): Promise<MongoResponse> => {
            let response: MongoResponse = await this._mongoService.insertOne(defaultData, ECollection.chats);

            if(!response["status"]) {
                return this._generalUtility.genericResponse(false, ChatServiceMessages.CREATION_FAILURE, 400);
            }

            for(let i = 0; i < users.length; i++) {
                const username: string = users[i]["username"];
                const query = { username: username };
                response = await this._mongoService.findOne(query, ECollection.users);
                if(!response["status"]) {
                    return this._generalUtility.genericResponse(false, ChatServiceMessages.CREATION_ADDUSER_FAILURE, 400);
                }

                const chat_list: string[] = response["result"] as string[];
                chat_list.push(defaultData["chat_id"]);
                const update = {
                    $set: {
                        chat_list: chat_list
                    }
                }

                response = await this._mongoService.updateOne(query, update, ECollection.users);

                if(!response["status"]) {
                    return this._generalUtility.genericResponse(false, ChatServiceMessages.CREATION_UPDATEUSER_FALIURE, 400);
                }
            }

            return this._mongoService.objResponse(true, null);
        })

        return this._generalUtility.genericResponse(true, ChatServiceMessages.CREATION_SUCCESS, 200);
    }

    async changeChatName(chat_id: string, user: IChatUser, new_name: string): Promise<IGenericResponse> {
        const verifyResponse: IGenericResponse = await this.verifyUserAccess(chat_id, user, true);
        if(!verifyResponse["status"]) {
            return verifyResponse;
        }

        const response: MongoResponse = await this._mongoService.handleConnection
        (async (): Promise<MongoResponse> => {
            const query = { chat_id: chat_id };
            const update = {
                $set: {
                    chat_name: new_name
                }
            };

            return await this._mongoService.updateOne(query, update, ECollection.chats);
        });

        if(response["status"]) {
            return this._generalUtility.genericResponse(false, ChatServiceMessages.UPDATE_NAME_SUCCESS, 200);
        }

        return this._generalUtility.genericResponse(false, ChatServiceMessages.UPDATE_NAME_FAILURE, 400);
    }

    async addAdmin(chat_id: string, request_user: IChatUser, recipient_user: IChatUser): Promise<IGenericResponse> {
        if(request_user === recipient_user) {
            return this._generalUtility.genericResponse(false, ChatServiceMessages.CANNOT_ADD_YOURSELF, 400);
        }

        let verifyResponse: IGenericResponse = await this.verifyUserAccess(chat_id, request_user, true);
        if(!verifyResponse["status"]) {
            return verifyResponse;
        }

        verifyResponse = await this.verifyUserAccess(chat_id, recipient_user, true);
        if(!verifyResponse["status"]) {
            if(verifyResponse["result"] === ChatServiceMessages.USER_NOT_ADMIN) {
                const response: IGenericResponse = await this._mongoService.handleConnection
                (async (): Promise<IGenericResponse> => {
                    const query = { chat_id: chat_id };
                    const response: MongoResponse = await this._mongoService.findOne(query, ECollection.users);
                    const admin: IChatUser[] = (response["result"] as IChatDetails)["admin"];
                    admin.push(recipient_user);
                    const update = {
                        $set: {
                            admin: admin
                        }
                    };
                    return await this._mongoService.updateOne(query, update, ECollection.chats);
                })

                if(response["status"]) {
                    return this._generalUtility.genericResponse(true, ChatServiceMessages.ADD_ADMIN_SUCCESS, 200);
                }

                return this._generalUtility.genericResponse(false, ChatServiceMessages.ADD_ADMIN_FAILURE, 400);
            }
        }

        return verifyResponse;
    }

    /*async removeAdmin(chat_id: string, request_user: IChatUser, recipient_user: IChatUser): Promise<IGenericResponse> {
        if(request_user === recipient_user) {
            return this._generalUtility.genericResponse(false, ChatServiceMessages.CANNOT_REMOVE_YOURSELF, 400);
        }


    }*/

    async addUser(chat_id: string, request_user: IChatUser, recipient_user: IChatUser): Promise<IGenericResponse> {
        const verifyUser: IGenericResponse = await this.userCRUDChecks(chat_id, request_user, recipient_user);
        if(!verifyUser["status"]) {
            return verifyUser;
        }

        const response: MongoResponse = await this._mongoService.handleConnection
        (async (): Promise<MongoResponse> => {
            const query = { chat_id: chat_id };
            const response: MongoResponse = await this._mongoService.findOne(query, ECollection.users);
            const users: IChatUser[] = (response["result"] as IChatDetails)["users"];
            users.push(recipient_user);
            const update = {
                $set: {
                    users: users
                }
            };
            return await this._mongoService.updateOne(query, update, ECollection.chats);
        })

        if(response["status"]) {
            return this._generalUtility.genericResponse(true, ChatServiceMessages.ADD_USER_SUCCESS, 200);
        }

        return this._generalUtility.genericResponse(false, ChatServiceMessages.ADD_USER_FAILURE, 400);
    }

    private async userCRUDChecks(chat_id: string, request_user: IChatUser, recipient_user: IChatUser): Promise<IGenericResponse> {
        if(request_user === recipient_user) {
            return this._generalUtility.genericResponse(false, ChatServiceMessages.CANNOT_ADD_YOURSELF, 400);
        }

        if(await this.verifyUserInChat(chat_id, recipient_user)) {
            return this._generalUtility.genericResponse(false, ChatServiceMessages.USER_ALREADY_IN_CHAT, 400);
        }

        const verifyResponse: IGenericResponse = await this.verifyUserAccess(chat_id, request_user);
        if(!verifyResponse["status"]) {
            return verifyResponse;
        }

        return this._generalUtility.genericResponse(true, null);
    }

    private async verifyUserInChat(chat_id: string, user: IChatUser): Promise<boolean> {
        return await this._mongoService.handleConnection
        (async (): Promise<Boolean> => {
            const query = { chat_id: chat_id };
            const response: MongoResponse =  await this._mongoService.findOne(query, ECollection.chats);
            const users: IChatUser[] = (response["result"] as IChatDetails)["users"];
            return users.includes(user);
        })
    }

    private async verifyUserAccess(chat_id: string, user: IChatUser, admin?: boolean): Promise<IGenericResponse> {
        if(!await this.verifyUserInChat(chat_id, user)) {
            return this._generalUtility.genericResponse(false, ChatServiceMessages.USER_NOT_IN_CHAT, 400);
        }

        return await this._mongoService.handleConnection
        (async (): Promise<IGenericResponse> => {
            const query = { chat_id: chat_id };
            let response: MongoResponse =  await this._mongoService.findOne(query, ECollection.chats);
            if(!response["status"]) {
                return this._generalUtility.genericResponse(false, ChatServiceMessages.NO_CHAT_WITH_ID, 400);
            }

            if(admin && (response["result"] as IChatDetails)["author"] != user) {
                const admins: IChatUser[] = (response["result"] as IChatDetails)["admin"];
                if(!admins.includes(user)) {
                    return this._generalUtility.genericResponse(false, ChatServiceMessages.USER_NOT_ADMIN, 400);
                }
            }

            return this._generalUtility.genericResponse(true, null);
        })
    }
}