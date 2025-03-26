import {ServiceFactory} from "./ServiceFactory";
import {generalUtilityInstance} from "../utility/UtilityModule";
import {ECollection} from "../enums/Collection.enum";
import {ELogServiceEvent} from "../enums/LogEvent.enum";
import {IFriendService, ServiceCRUDResponse} from "../interfaces/FriendService.interface";
import {IMongoService, MongoResponse} from "../interfaces/MongoService.interface";
import {IAccountService, IUserDetails} from "../interfaces/AccountService.interface";
import {ILogService} from "../interfaces/LogService.interface";
import {IChatUser} from "../interfaces/ChatService.interface";
import {IGeneralUtility, IGenericResponse} from "../interfaces/utility/General.interface";

const FriendServiceMessages = {
    CANNOT_ADD_YOURSELF: "You cannot add yourself as a friend.",
    CANNOT_REMOVE_YOURSELF: "You cannot remove yourself as a friend.",
    CANNOT_BLOCK_YOURSELF: "You cannot block yourself.",
    CANNOT_UNBLOCK_YOURSELF: "You cannot unblock yourself.",
    UNABLE_LOCATE_USER: "Could not locate user requested.",
    USER_ALREADY_FRIEND: "User is already your friend.",
    UNABLE_UPDATE_FRIEND_REQUEST: "Unable to update friend on request user.",
    UNABLE_UPDATE_FRIEND_RECIPIENT: "Unable to update friend on recipient user.",
    UNABLE_UPDATE_BLOCKED_REQUEST: "Unable to update blocked on request user.",
    UNABLE_UPDATE_BLOCKED_RECIPIENT: "Unable to update blocked on request user.",
    ADD_FRIEND_SUCCESS: "Successfully added friend to friend list.",
    USER_NOT_FRIEND: "User is already not your friend.",
    REMOVE_FRIEND_SUCCESS: "Successfully removed friend from friend list.",
    USER_ALREADY_BLOCKED: "User is already blocked.",
    USER_ALREADY_UNBLOCKED: "User is already unblocked.",
    BLOCK_USER_SUCCESS: "Successfully blocked user from account.",
    UNBLOCK_USER_SUCCESS: "Successfully unblocked user from account."
}

export class FriendService implements IFriendService {
    private _mongoService: IMongoService;
    private _accountService: IAccountService;
    private _generalUtility: IGeneralUtility;
    private _logService: ILogService;

    constructor() {
        this._mongoService = ServiceFactory.createMongoService();
        this._accountService = ServiceFactory.createAccountService();
        this._generalUtility = generalUtilityInstance;
        this._logService = ServiceFactory.createLogService();
    }

    private async serviceCRUDChecks(request_user: IChatUser, recipient_user: IChatUser, msg: string, friend_list: boolean): Promise<IGenericResponse> {
        if(request_user === recipient_user) {
            return this._generalUtility.genericResponse(false, msg, 400);
        }

        const requestUsername: string = request_user["username"];
        const recipientUsername: string = recipient_user["username"];

        const userDetails: IGenericResponse = await this._accountService.getAccountsDetails([requestUsername, recipientUsername]);
        if(!userDetails["status"]) {
            return this._generalUtility.genericResponse(false, FriendServiceMessages.UNABLE_LOCATE_USER, 400);
        }

        const accountsDetails: IUserDetails[] = userDetails["result"] as IUserDetails[];
        const requestAccountDetails: IUserDetails = accountsDetails.find(u => u["username"] === requestUsername) as IUserDetails;
        const recipientAccountDetails: IUserDetails = accountsDetails.find(u => u["username"] === recipientUsername) as IUserDetails;

        if(friend_list) {
            const response: ServiceCRUDResponse = {
                requestFriendList: requestAccountDetails["friend_list"],
                recipientFriendList: recipientAccountDetails["friend_list"]
            }

            return this._generalUtility.genericResponse(true, response);
        }

        const response: ServiceCRUDResponse = {
            requestBlockedUsers: requestAccountDetails["blocked_users"]
        }

        return this._generalUtility.genericResponse(true, response);
    }

    private async updateDatabaseLists(requestUsername: string, requestList: IChatUser[]
                                      , msg: string, friend_list: boolean, recipientUsername?: string, recipientList?: IChatUser[]): Promise<IGenericResponse> {
        return await this._mongoService.handleConnection
        (async (): Promise<IGenericResponse> => {
            const requestQuery = { username: requestUsername };
            let requestUpdate: {};

            if(friend_list) {
                const recipientQuery = { username: recipientUsername };
                requestUpdate = {
                    $set: {
                        friend_list: requestList
                    }
                }

                const recipientUpdate = {
                    $set: {
                        friend_list: recipientList
                    }
                }

                const response = await this._mongoService.updateOne(recipientQuery, recipientUpdate, ECollection.users);
                if(!response["status"]) {
                    return this._generalUtility.genericResponse(false, FriendServiceMessages.UNABLE_UPDATE_FRIEND_RECIPIENT, 400);
                }
            } else {
                requestUpdate = {
                    $set: {
                        blocked_users: requestList
                    }
                }
            }

            let response: MongoResponse = await this._mongoService.updateOne(requestQuery, requestUpdate, ECollection.users);
            if(!response["status"]) {
                if(friend_list) {
                    return this._generalUtility.genericResponse(false, FriendServiceMessages.UNABLE_UPDATE_FRIEND_REQUEST, 400);
                }

                return this._generalUtility.genericResponse(false, FriendServiceMessages.UNABLE_UPDATE_BLOCKED_REQUEST, 400);
            }

            switch (msg) {
                case FriendServiceMessages.ADD_FRIEND_SUCCESS:
                    await this._logService.addLog({
                        timestamp: new Date(Date.now()),
                        event: ELogServiceEvent.FRIEND_ADD_USER,
                        username: requestUsername,
                        recipient_username: recipientUsername
                    });
                    break;
                case FriendServiceMessages.REMOVE_FRIEND_SUCCESS:
                    await this._logService.addLog({
                        timestamp: new Date(Date.now()),
                        event: ELogServiceEvent.FRIEND_REMOVE_USER,
                        username: requestUsername,
                        recipient_username: recipientUsername
                    });
                    break;
                case FriendServiceMessages.BLOCK_USER_SUCCESS:
                    await this._logService.addLog({
                        timestamp: new Date(Date.now()),
                        event: ELogServiceEvent.FRIEND_BLOCK_USER,
                        username: requestUsername
                    });
                    break;
                case FriendServiceMessages.UNBLOCK_USER_SUCCESS:
                    await this._logService.addLog({
                        timestamp: new Date(Date.now()),
                        event: ELogServiceEvent.FRIEND_UNBLOCK_USER,
                        username: requestUsername
                    });
                    break;
            }

            return this._generalUtility.genericResponse(true, msg, 200);
        });
    }

    async addFriend(request_user: IChatUser, recipient_user: IChatUser): Promise<IGenericResponse> {
        const serviceCRUDChecks: IGenericResponse = await this.serviceCRUDChecks(request_user, recipient_user, FriendServiceMessages.CANNOT_ADD_YOURSELF, true);
        if(!serviceCRUDChecks) {
            return serviceCRUDChecks;
        }

        const requestFriendList: IChatUser[] = (serviceCRUDChecks["result"] as ServiceCRUDResponse)["requestFriendList"] as IChatUser[];
        const recipientFriendList: IChatUser[] = (serviceCRUDChecks["result"] as ServiceCRUDResponse)["recipientFriendList"] as IChatUser[];

        if(requestFriendList.some(u => u["user_id"] === recipient_user["user_id"])
            || recipientFriendList.some(u => u["user_id"] === request_user["user_id"])) {
            return this._generalUtility.genericResponse(false, FriendServiceMessages.USER_ALREADY_FRIEND, 400);
        }

        requestFriendList.push(recipient_user);
        recipientFriendList.push(request_user);

        return this.updateDatabaseLists(request_user["username"], requestFriendList, FriendServiceMessages.ADD_FRIEND_SUCCESS
            , true, recipient_user["username"], recipientFriendList);
    }

    async removeFriend(request_user: IChatUser, recipient_user: IChatUser): Promise<IGenericResponse> {
        const serviceCRUDChecks: IGenericResponse = await this.serviceCRUDChecks(request_user, recipient_user, FriendServiceMessages.CANNOT_REMOVE_YOURSELF, true);
        if(!serviceCRUDChecks) {
            return serviceCRUDChecks;
        }

        let requestFriendList: IChatUser[] = (serviceCRUDChecks["result"] as ServiceCRUDResponse)["requestFriendList"]  as IChatUser[];
        let recipientFriendList: IChatUser[] = (serviceCRUDChecks["result"] as ServiceCRUDResponse)["recipientFriendList"] as IChatUser[];

        if(!requestFriendList.some(u => u["user_id"] === recipient_user["user_id"])
            || !recipientFriendList.some(u => u["user_id"] === request_user["user_id"])) {
            return this._generalUtility.genericResponse(false, FriendServiceMessages.USER_NOT_FRIEND, 400);
        }

        requestFriendList = this._generalUtility.deleteUserInArray(recipient_user, requestFriendList);
        recipientFriendList = this._generalUtility.deleteUserInArray(request_user, recipientFriendList);

        return this.updateDatabaseLists(request_user["username"], requestFriendList, FriendServiceMessages.ADD_FRIEND_SUCCESS
            , true, recipient_user["username"], recipientFriendList);
    }

    async blockFriend(request_user: IChatUser, recipient_user: IChatUser): Promise<IGenericResponse> {
        const serviceCRUDChecks: IGenericResponse = await this.serviceCRUDChecks(request_user, recipient_user, FriendServiceMessages.CANNOT_BLOCK_YOURSELF, false);
        if(!serviceCRUDChecks) {
            return serviceCRUDChecks;
        }

        const requestBlockedUsers: IChatUser[] = (serviceCRUDChecks["result"] as ServiceCRUDResponse)["requestBlockedUsers"] as IChatUser[];

        if(requestBlockedUsers.some(u => u["user_id"] === recipient_user["user_id"])) {
            return this._generalUtility.genericResponse(false, FriendServiceMessages.USER_ALREADY_BLOCKED, 400);
        }

        requestBlockedUsers.push(recipient_user);

        return this.updateDatabaseLists(request_user["username"], requestBlockedUsers, FriendServiceMessages.BLOCK_USER_SUCCESS, false);
    }

    async unblockFriend(request_user: IChatUser, recipient_user: IChatUser): Promise<IGenericResponse> {
        const serviceCRUDChecks: IGenericResponse = await this.serviceCRUDChecks(request_user, recipient_user, FriendServiceMessages.CANNOT_UNBLOCK_YOURSELF, false);
        if(!serviceCRUDChecks) {
            return serviceCRUDChecks;
        }

        let requestBlockedUsers: IChatUser[] = (serviceCRUDChecks["result"] as ServiceCRUDResponse)["requestBlockedUsers"] as IChatUser[];

        if(!requestBlockedUsers.some(u => u["user_id"] === recipient_user["user_id"])) {
            return this._generalUtility.genericResponse(false, FriendServiceMessages.USER_ALREADY_UNBLOCKED, 400);
        }

        requestBlockedUsers = this._generalUtility.deleteUserInArray(recipient_user, requestBlockedUsers);

        return this.updateDatabaseLists(request_user["username"], requestBlockedUsers, FriendServiceMessages.UNBLOCK_USER_SUCCESS, false);
    }
}