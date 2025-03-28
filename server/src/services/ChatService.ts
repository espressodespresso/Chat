import {ServiceFactory} from "./ServiceFactory";
import {generalUtilityInstance} from "../utility/UtilityModule";
import {ECollection} from "../enums/Collection.enum";
import {ELogServiceEvent} from "../enums/LogEvent.enum";
import {IChatDetails, IChatService, IChatUser} from "../interfaces/ChatService.interface";
import {IMongoService, MongoResponse} from "../interfaces/MongoService.interface";
import {IAccountService, IUserDetails} from "../interfaces/AccountService.interface";
import {ILogService} from "../interfaces/LogService.interface";
import {IGeneralUtility, IGenericResponse} from "../interfaces/utility/General.interface";
import {ISocketMessage, ISocketService} from "../interfaces/SocketService.interface";
import {socketServiceInstance} from "./singleton/SocketModule";
import {ESocketUpdateEvent, ESocketUpdateEventType} from "../enums/SocketEvent.enum";

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
    REMOVE_ADMIN_SUCCESS: "Successfully removed admin from the chat.",
    REMOVE_ADMIN_FAILURE: "Unable to remove admin from the chat.",
    REMOVE_USER_SUCCESS: "Successfully removed user from the chat.",
    REMOVE_USER_FAILURE: "Unable to remove user from the chat.",
    USER_NOT_AUTHOR: "Unable to delete chat as user is not the chat author.",
    UNABLE_LOCATE_USER: "Could not locate user within chat, skipping...",
    DELETE_CHAT_SUCCESS: "Successfully deleted the chat.",
    CANNOT_REMOVE_AUTHOR: "You cannot remove the author from the users list.",
    DUPLICATES_WITHIN_USERS: "The users list contains duplicates, remove and try again.",
    DUPLICATES_WITHIN_ADMIN: "The admin list contains duplicates, remove and try again.",
    DELETE_CHAT_FAILURE: "Unable to delete the chat.",
    NO_NOTIFICATION_USER: "Unable to directly notify user using socket"
}

export class ChatService implements IChatService {
    private _mongoService: IMongoService;
    private _generalUtility: IGeneralUtility;
    private _accountService: IAccountService;
    private _logService: ILogService;
    private _socketService: ISocketService;

    constructor() {
        this._mongoService = ServiceFactory.createMongoService();
        this._generalUtility = generalUtilityInstance;
        this._accountService = ServiceFactory.createAccountService();
        this._logService = ServiceFactory.createLogService();
        this._socketService = socketServiceInstance;
    }

    async createChat(chat_name: string, creator_user: IChatUser, users: IChatUser[]): Promise<IGenericResponse> {
        const chat_id: string = await this._generalUtility.generateID(ECollection.chats)
        users.push(creator_user);
        const defaultData: IChatDetails = {
            chat_id: chat_id,
            chat_name: chat_name,
            users: users,
            admin: [],
            author: creator_user,
            date_added: new Date(Date.now())
        }

        if(users.length > 1) {
            let tempSetCheck: Set<string> = new Set();
            for(let i = 0; i < users.length; i++) {
                const userID: string = users[i]["user_id"];
                if(tempSetCheck.has(userID)) {
                    return this._generalUtility.genericResponse(false, ChatServiceMessages.DUPLICATES_WITHIN_USERS, 400);
                }

                tempSetCheck.add(userID);
            }
        }

        const response: IGenericResponse = await this._mongoService.handleConnection
        (async (): Promise<IGenericResponse> => {
            let response: MongoResponse = await this._mongoService.insertOne(defaultData, ECollection.chats);

            if(!response["status"]) {
                return this._generalUtility.genericResponse(false, ChatServiceMessages.CREATION_FAILURE, 400);
            }

            for(let i = 0; i < users.length; i++) {
                const user_id: string = users[i]["user_id"];
                const query = { user_id: user_id };
                response = await this._mongoService.findOne(query, ECollection.users);
                if(!response["status"]) {
                    return this._generalUtility.genericResponse(false, ChatServiceMessages.CREATION_ADDUSER_FAILURE, 400);
                }

                const chat_list: string[] = (response["result"] as IUserDetails)["chat_list"] as string[];
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

                // Function exists but already looping so may as well
                const socketMessage: ISocketMessage = this._socketService.createSocketMessageUpdate(user_id, creator_user["user_id"], {
                    event: ESocketUpdateEvent.CHAT,
                    type: ESocketUpdateEventType.CREATE,
                    id: chat_id
                });

                if(!await this._socketService.sendToActiveUserID(socketMessage)) {
                    console.error(`${ChatServiceMessages.NO_NOTIFICATION_USER} to ${user_id}, likely offline.`);
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
            user_id: creator_user["user_id"],
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
            await this.pushSocketUpdateToUsers(user["user_id"], chat_id, await this.getUsersInChat(chat_id)
                , ESocketUpdateEventType.UPDATE);

            await this._logService.addLog({
                timestamp: new Date(Date.now()),
                event: ELogServiceEvent.CHAT_CHANGE_NAME,
                user_id: user["user_id"],
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
                const response: MongoResponse = await this._mongoService.handleConnection
                (async (): Promise<MongoResponse> => {
                    const query = { chat_id: chat_id };
                    let response: MongoResponse = await this._mongoService.findOne(query, ECollection.chats);
                    const chatDetails: IChatDetails = response["result"] as IChatDetails;
                    const admin: IChatUser[] = chatDetails["admin"];
                    admin.push(recipient_user);
                    const update = {
                        $set: {
                            admin: admin
                        }
                    };
                    response = await this._mongoService.updateOne(query, update, ECollection.chats);
                    if(response["status"]) {
                        await this.pushSocketUpdateToUsers(request_user["user_id"], chat_id, chatDetails["users"]
                            , ESocketUpdateEventType.UPDATE);
                    }

                    return response;
                })

                if(response["status"]) {
                    await this._logService.addLog({
                        timestamp: new Date(Date.now()),
                        event: ELogServiceEvent.CHAT_ADD_ADMIN,
                        user_id: request_user["user_id"],
                        recipient_id: recipient_user["user_id"],
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
                let response: MongoResponse = await this._mongoService.findOne(query, ECollection.chats);
                const chatDetails: IChatDetails = response["result"] as IChatDetails;
                let admin: IChatUser[] = this._generalUtility.deleteUserInArray(recipient_user
                    , chatDetails["admin"]);

                const update = {
                    $set: {
                        admin: admin
                    }
                }
                response = await this._mongoService.updateOne(query, update, ECollection.chats);
                if(response["status"]) {
                    await this.pushSocketUpdateToUsers(request_user["user_id"], chat_id, chatDetails["users"]
                        , ESocketUpdateEventType.UPDATE);
                }

                return response;
            })

            if(response["status"]) {
                await this._logService.addLog({
                    timestamp: new Date(Date.now()),
                    event: ELogServiceEvent.CHAT_REMOVE_ADMIN,
                    user_id: request_user["user_id"],
                    recipient_id: recipient_user["user_id"],
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
            const chatQuery = { chat_id: chat_id };
            let response: MongoResponse = await this._mongoService.findOne(chatQuery, ECollection.chats);
            const chatDetails: IChatDetails = response["result"] as IChatDetails;
            const users: IChatUser[] = chatDetails["users"];
            users.push(recipient_user);
            const chatUpdate = {
                $set: {
                    users: users
                }
            };
            response = await this._mongoService.updateOne(chatQuery, chatUpdate, ECollection.chats);
            if(!response["status"]) {
                return response;
            }

            const userQuery = { user_id: recipient_user["user_id"] };
            response = await this._mongoService.findOne(userQuery, ECollection.users);
            if(!response["status"]) {
                return response;
            }

            const userChatList: string[] = (response["result"] as IUserDetails)["chat_list"];
            userChatList.push(chat_id);
            const userUpdate = {
                $set: {
                    chat_list: userChatList
                }
            };
            response = await this._mongoService.updateOne(userQuery, userUpdate, ECollection.users);
            if(response["status"]) {
                await this.pushSocketUpdateToUsers(request_user["user_id"], chat_id, chatDetails["users"]
                    , ESocketUpdateEventType.UPDATE);
            }

            return response;
        })

        if(response["status"]) {
            await this._logService.addLog({
                timestamp: new Date(Date.now()),
                event: ELogServiceEvent.CHAT_ADD_USER,
                user_id: request_user["user_id"],
                recipient_id: recipient_user["user_id"],
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
                const chatQuery = { chat_id: chat_id };
                let response: MongoResponse = await this._mongoService.findOne(chatQuery, ECollection.chats);
                const chatDetails: IChatDetails = response["result"] as IChatDetails;
                if(chatDetails["author"] === recipient_user) {
                    return this._mongoService.objResponse(false, ChatServiceMessages.CANNOT_REMOVE_AUTHOR);
                }
                const users: IChatUser[] = this._generalUtility.deleteUserInArray(recipient_user
                    , chatDetails["users"]);
                let admin: IChatUser[] = chatDetails["admin"];
                let update = {}
                if(admin.some(u => u["user_id"] === recipient_user["user_id"])) {
                    admin = this._generalUtility.deleteUserInArray(recipient_user, admin);
                    update = {
                        $set: {
                            users: users,
                            admin: admin
                        }
                    };
                } else {
                    update = {
                        $set: {
                            users: users
                        }
                    };
                }
                response = await this._mongoService.updateOne(chatQuery, update, ECollection.chats);
                if(!response["status"]) {
                    return response;
                }

                const userQuery = { user_id: recipient_user["user_id"] };
                response = await this._mongoService.findOne(userQuery, ECollection.users);
                if(!response["status"]) {
                    return response;
                }

                update = {
                    $set: {
                        chat_list: this.deleteChatInArray(chat_id, (response["result"] as IUserDetails)["chat_list"])
                    }
                };

                response = await this._mongoService.updateOne(userQuery, update, ECollection.users);
                if(response["status"]) {
                    await this.pushSocketUpdateToUsers(request_user["user_id"], chat_id, chatDetails["users"]
                        , ESocketUpdateEventType.UPDATE);
                }

                return response;
            })

            if(!response["status"] && response["result"] === ChatServiceMessages.CANNOT_REMOVE_AUTHOR) {
                return this._generalUtility.genericResponse(false, ChatServiceMessages.CANNOT_REMOVE_AUTHOR, 400);
            }

            if(response["status"]) {
                await this._logService.addLog({
                    timestamp: new Date(Date.now()),
                    event: ELogServiceEvent.CHAT_REMOVE_USER,
                    user_id: request_user["user_id"],
                    recipient_id: recipient_user["user_id"],
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
            if(author["user_id"] !== request_user["user_id"]) {
                return this._generalUtility.genericResponse(false, ChatServiceMessages.USER_NOT_AUTHOR, 400);
            }

            const users: IChatUser[] = chatDetails["users"];
            for(let i = 0; i < users.length; i++) {
                const user: IChatUser = users[i];
                const user_id: string = user["user_id"];
                const userQuery = { user_id: user_id };
                const userDetailsResponse: IGenericResponse = await this._accountService.getAccountDetailsByID(user_id);
                if(!userDetailsResponse.status) {
                    console.error(ChatServiceMessages.UNABLE_LOCATE_USER);
                }

                const update = {
                    $set: {
                        chat_list: this.deleteChatInArray(chatDetails["chat_id"]
                            , (userDetailsResponse["result"] as IUserDetails)["chat_list"])
                    }
                }

                try {
                    await this._mongoService.updateOne(userQuery, update, ECollection.users);
                } catch (error) {
                    console.error(ChatServiceMessages.UNABLE_LOCATE_USER);
                }

                const socketMessage: ISocketMessage = this._socketService.createSocketMessageUpdate(user_id, request_user["user_id"], {
                    event: ESocketUpdateEvent.CHAT,
                    type: ESocketUpdateEventType.DELETE,
                    id: chat_id
                });

                if(!await this._socketService.sendToActiveUserID(socketMessage)) {
                    console.error(`${ChatServiceMessages.NO_NOTIFICATION_USER} to ${user_id}, likely offline.`);
                }
            }

            response = await this._mongoService.deleteOne(chatQuery, ECollection.chats);
            if(!response["status"]) {
                return this._generalUtility.genericResponse(false, ChatServiceMessages.DELETE_CHAT_FAILURE, 400);
            }

            await this._logService.addLog({
                timestamp: new Date(Date.now()),
                event: ELogServiceEvent.CHAT_DELETE,
                user_id: request_user["user_id"],
                message: chat_id
            });

            return this._generalUtility.genericResponse(true, ChatServiceMessages.DELETE_CHAT_SUCCESS, 200);
        })
    }

    private async getUsersInChat(chat_id: string): Promise<IChatUser[]> {
        const response: MongoResponse = await this._mongoService.handleConnection
        (async (): Promise<MongoResponse> => {
            const query = { chat_id: chat_id };
            return await this._mongoService.findOne(query, ECollection.chats);
        });

        if(response["status"]) {
            return response["result"] as IChatUser[];
        }

        return [];
    }

    private async pushSocketUpdateToUsers(updater_id: string, chat_id: string, users: IChatUser[], type: ESocketUpdateEventType): Promise<void> {
        for(let i = 0; i < users.length; i++) {
            const user_id: string = users[i]["user_id"]
            const socketMessage: ISocketMessage = this._socketService.createSocketMessageUpdate(user_id, updater_id, {
                event: ESocketUpdateEvent.CHAT,
                type: type,
                id: chat_id
            });

            if(!await this._socketService.sendToActiveUserID(socketMessage)) {
                console.error(`${ChatServiceMessages.NO_NOTIFICATION_USER} to ${user_id}, likely offline.`);
            }
        }
    }

    private deleteChatInArray(chat_id: string, chat_list: string[]): string[] {
        for(let i = 0; i < chat_list.length; i++) {
            const curr_chat_id: string = chat_list[i];
            if(curr_chat_id === chat_id) {
                chat_list.splice(i, 1);
                break;
            }
        }

        return chat_list;
    }

    private async adminCRUDChecks(chat_id: string, request_user: IChatUser, recipient_user: IChatUser, add: boolean): Promise<IGenericResponse> {
        if(request_user === recipient_user && add) {
            return this._generalUtility.genericResponse(false, ChatServiceMessages.CANNOT_ADD_YOURSELF, 400);
        }

        let verifyResponse: IGenericResponse = await this.verifyUserAccess(chat_id, request_user, true);
        if(!verifyResponse["status"]) {
            return verifyResponse;
        }

        return await this.verifyUserAccess(chat_id, recipient_user, true);
    }

    private async userCRUDChecks(chat_id: string, request_user: IChatUser, recipient_user: IChatUser, add: boolean): Promise<IGenericResponse> {
        if(request_user["user_id"] === recipient_user["user_id"] && add) {
            return this._generalUtility.genericResponse(false, ChatServiceMessages.CANNOT_ADD_YOURSELF, 400);
        }

        if(await this.verifyUserInChat(chat_id, recipient_user) && add) {
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
            return users.some(u => u["user_id"] === user["user_id"]);
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

            if(admin && (response["result"] as IChatDetails)["author"]["user_id"] != user["user_id"]) {
                const admins: IChatUser[] = (response["result"] as IChatDetails)["admin"];
                if(!admins.some(u => u["user_id"] === user["user_id"])) {
                    return this._generalUtility.genericResponse(false, ChatServiceMessages.USER_NOT_ADMIN, 400);
                }
            }

            return this._generalUtility.genericResponse(true, null);
        })
    }
}