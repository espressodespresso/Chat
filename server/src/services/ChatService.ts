import {IMongoService, MongoResponse} from "./MongoService";
import {ServiceFactory} from "./ServiceFactory";
import {IGeneralUtility, IGenericResponse} from "../utility/General.utility";
import {generalUtilityInstance} from "../utility/UtilityModule";
import {ECollection} from "../enums/Collection.enum";
import {IAccountService, IUserDetails} from "./AccountService";
import {ELogServiceEvent} from "../enums/LogEvent.enum";
import {ILogService} from "./LogService";

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
    createChat(chat_name: string, creator_user: IChatUser, users: IChatUser[]): Promise<IGenericResponse>;
    changeChatName(chat_id: string, user: IChatUser, new_name: string): Promise<IGenericResponse>;
    addAdmin(chat_id: string, request_user: IChatUser, recipient_user: IChatUser): Promise<IGenericResponse>;
    removeAdmin(chat_id: string, request_user: IChatUser, recipient_user: IChatUser): Promise<IGenericResponse>;
    addUser(chat_id: string, request_user: IChatUser, recipient_user: IChatUser): Promise<IGenericResponse>;
    removeUser(chat_id: string, request_user: IChatUser, recipient_user: IChatUser): Promise<IGenericResponse>;
    deleteChat(chat_id: string, request_user: IChatUser): Promise<IGenericResponse>;
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
    CANNOT_REMOVE_YOURSELF: "Unable to remove yourself from the chat",
    REMOVE_ADMIN_SUCCESS: "Successfully removed admin from the chat.",
    REMOVE_ADMIN_FAILURE: "Unable to remove admin from the chat.",
    REMOVE_USER_SUCCESS: "Successfully removed user from the chat.",
    REMOVE_USER_FAILURE: "Unable to remove user from the chat.",
    USER_NOT_AUTHOR: "Unable to delete chat as user is not the chat author.",
    UNABLE_LOCATE_USER: "Could not locate user within chat, skipping...",
    DELETE_CHAT_SUCCESS: "Successfully deleted the chat."
}

export class ChatService implements IChatService {
    private _mongoService: IMongoService;
    private _generalUtility: IGeneralUtility;
    private _accountService: IAccountService;
    private _logService: ILogService;

    constructor() {
        this._mongoService = ServiceFactory.createMongoService();
        this._generalUtility = generalUtilityInstance;
        this._accountService = ServiceFactory.createAccountService();
        this._logService = ServiceFactory.createLogService();
    }

    async createChat(chat_name: string, creator_user: IChatUser, users: IChatUser[]): Promise<IGenericResponse> {
        const chat_id: string = this._generalUtility.generateID()
        const defaultData: IChatDetails = {
            chat_id: chat_id,
            chat_name: chat_name,
            users: users,
            admin: [],
            author: creator_user,
            date_added: new Date(Date.now())
        }

        const response: IGenericResponse = await this._mongoService.handleConnection
        (async (): Promise<IGenericResponse> => {
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

        if(!response["status"]) {
            return response;
        }

        await this._logService.addLog({
            timestamp: new Date(Date.now()),
            event: ELogServiceEvent.CHAT_CREATE,
            username: creator_user["username"],
            message: chat_id
        });

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
            await this._logService.addLog({
                timestamp: new Date(Date.now()),
                event: ELogServiceEvent.CHAT_CHANGE_NAME,
                username: user["username"],
                message: chat_id
            });

            return this._generalUtility.genericResponse(false, ChatServiceMessages.UPDATE_NAME_SUCCESS, 200);
        }

        return this._generalUtility.genericResponse(false, ChatServiceMessages.UPDATE_NAME_FAILURE, 400);
    }

    async addAdmin(chat_id: string, request_user: IChatUser, recipient_user: IChatUser): Promise<IGenericResponse> {
        const verifyResponse: IGenericResponse = await this.adminCRUDChecks(chat_id, request_user, recipient_user, true);
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
                    await this._logService.addLog({
                        timestamp: new Date(Date.now()),
                        event: ELogServiceEvent.CHAT_ADD_ADMIN,
                        username: request_user["username"],
                        recipient_username: recipient_user["username"],
                        message: chat_id
                    });

                    return this._generalUtility.genericResponse(true, ChatServiceMessages.ADD_ADMIN_SUCCESS, 200);
                }

                return this._generalUtility.genericResponse(false, ChatServiceMessages.ADD_ADMIN_FAILURE, 400);
            }
        }

        return verifyResponse;
    }

    async removeAdmin(chat_id: string, request_user: IChatUser, recipient_user: IChatUser): Promise<IGenericResponse> {
        const verifyResponse: IGenericResponse = await this.adminCRUDChecks(chat_id, request_user, recipient_user, false);
        if(verifyResponse["status"]) {
            const response: MongoResponse = await this._mongoService.handleConnection
            (async (): Promise<MongoResponse> => {
                const query = { chat_id: chat_id };
                const response: MongoResponse = await this._mongoService.findOne(query, ECollection.chats);
                const admin: IChatUser[] = (response["result"] as IChatDetails)["admin"];
                const adminSet: Set<IChatUser> = new Set(admin);
                adminSet.delete(recipient_user);
                const update = {
                    $set: {
                        admin: Array.from(adminSet)
                    }
                };
                return await this._mongoService.updateOne(query, update, ECollection.chats);
            })

            if(response["status"]) {
                await this._logService.addLog({
                    timestamp: new Date(Date.now()),
                    event: ELogServiceEvent.CHAT_REMOVE_ADMIN,
                    username: request_user["username"],
                    recipient_username: recipient_user["username"],
                    message: chat_id
                });

                return this._generalUtility.genericResponse(true, ChatServiceMessages.REMOVE_ADMIN_SUCCESS, 200);
            }

            return this._generalUtility.genericResponse(false, ChatServiceMessages.REMOVE_ADMIN_FAILURE, 400);
        }

        return this._generalUtility.genericResponse(false, ChatServiceMessages.REMOVE_ADMIN_FAILURE, 400);
    }

    async addUser(chat_id: string, request_user: IChatUser, recipient_user: IChatUser): Promise<IGenericResponse> {
        const verifyUser: IGenericResponse = await this.userCRUDChecks(chat_id, request_user, recipient_user, true);
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
            await this._logService.addLog({
                timestamp: new Date(Date.now()),
                event: ELogServiceEvent.CHAT_ADD_USER,
                username: request_user["username"],
                recipient_username: recipient_user["username"],
                message: chat_id
            });

            return this._generalUtility.genericResponse(true, ChatServiceMessages.ADD_USER_SUCCESS, 200);
        }

        return this._generalUtility.genericResponse(false, ChatServiceMessages.ADD_USER_FAILURE, 400);
    }

    async removeUser(chat_id: string, request_user: IChatUser, recipient_user: IChatUser): Promise<IGenericResponse> {
        const verifyUser: IGenericResponse = await this.userCRUDChecks(chat_id, request_user, recipient_user, false);
        if(verifyUser["status"]) {
            const response: MongoResponse = await this._mongoService.handleConnection
            (async (): Promise<MongoResponse> => {
                const query = { chat_id: chat_id };
                const response: MongoResponse = await this._mongoService.findOne(query, ECollection.chats);
                const users: IChatUser[] = (response["result"] as IChatDetails)["users"];
                const usersSet: Set<IChatUser> = new Set(users);
                usersSet.delete(recipient_user);
                const admin: IChatUser[] = (response["result"] as IChatDetails)["admin"];
                const adminSet: Set<IChatUser> = new Set(admin);
                let update = {}
                if(admin.includes(recipient_user)) {
                    adminSet.delete(recipient_user);
                    update = {
                        $set: {
                            users: Array.from(usersSet),
                            admin: Array.from(adminSet)
                        }
                    };
                } else {
                    update = {
                        $set: {
                            users: Array.from(usersSet)
                        }
                    };
                }
                return await this._mongoService.updateOne(query, update, ECollection.chats);
            })

            if(response["status"]) {
                await this._logService.addLog({
                    timestamp: new Date(Date.now()),
                    event: ELogServiceEvent.CHAT_REMOVE_USER,
                    username: request_user["username"],
                    recipient_username: recipient_user["username"],
                    message: chat_id
                });

                return this._generalUtility.genericResponse(true, ChatServiceMessages.REMOVE_USER_SUCCESS, 200);
            }

            return this._generalUtility.genericResponse(false, ChatServiceMessages.REMOVE_USER_FAILURE, 400);
        }

        return this._generalUtility.genericResponse(false, ChatServiceMessages.REMOVE_USER_FAILURE, 400);
    }

    async deleteChat(chat_id: string, request_user: IChatUser): Promise<IGenericResponse> {
        return await this._mongoService.handleConnection
        (async (): Promise<IGenericResponse> => {
            const chatQuery = { chat_id: chat_id };
            let response: MongoResponse = await this._mongoService.findOne(chatQuery, ECollection.chats);
            const chatDetails: IChatDetails = response["result"] as IChatDetails;
            if(!response["status"]){
                return this._generalUtility.genericResponse(false, ChatServiceMessages.NO_CHAT_WITH_ID, 400);
            }

            const author: IChatUser = chatDetails["author"];
            if(author !== request_user) {
                return this._generalUtility.genericResponse(false, ChatServiceMessages.USER_NOT_AUTHOR, 400);
            }

            const users: IChatUser[] = chatDetails["users"];
            for(let i = 0; i < users.length; i++) {
                const user: IChatUser = users[i];
                const username: string = user["username"];
                const userQuery = { username: username };
                const userDetailsResponse: IGenericResponse = await this._accountService.getAccountDetails(username);
                if(!userDetailsResponse.status) {
                    console.error(ChatServiceMessages.UNABLE_LOCATE_USER);
                }

                const userDetails : IUserDetails = userDetailsResponse["result"] as IUserDetails;
                const chatsSet: Set<string> = new Set(userDetails["chat_list"]);
                chatsSet.delete(chatDetails["chat_id"]);
                const update = {
                    $set: {
                        chat_list: Array.from(chatsSet)
                    }
                };

                try {
                    await this._mongoService.updateOne(userQuery, update, ECollection.users);
                } catch (error) {
                    console.error(ChatServiceMessages.UNABLE_LOCATE_USER);
                }
            }

            await this._logService.addLog({
                timestamp: new Date(Date.now()),
                event: ELogServiceEvent.CHAT_DELETE,
                username: request_user["username"],
                message: chat_id
            });

            return this._generalUtility.genericResponse(true, ChatServiceMessages.DELETE_CHAT_SUCCESS, 200);
        })
    }

    private async adminCRUDChecks(chat_id: string, request_user: IChatUser, recipient_user: IChatUser, add: boolean): Promise<IGenericResponse> {
        if(request_user === recipient_user) {
            if(add) {
                return this._generalUtility.genericResponse(false, ChatServiceMessages.CANNOT_ADD_YOURSELF, 400);
            }

            return this._generalUtility.genericResponse(false, ChatServiceMessages.CANNOT_REMOVE_YOURSELF, 400);
        }

        let verifyResponse: IGenericResponse = await this.verifyUserAccess(chat_id, request_user, true);
        if(!verifyResponse["status"]) {
            return verifyResponse;
        }

        return await this.verifyUserAccess(chat_id, recipient_user, true);
    }

    private async userCRUDChecks(chat_id: string, request_user: IChatUser, recipient_user: IChatUser, add: boolean): Promise<IGenericResponse> {
        if(request_user === recipient_user) {
            if(add) {
                return this._generalUtility.genericResponse(false, ChatServiceMessages.CANNOT_ADD_YOURSELF, 400);
            }

            return this._generalUtility.genericResponse(false, ChatServiceMessages.CANNOT_REMOVE_YOURSELF, 400);
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