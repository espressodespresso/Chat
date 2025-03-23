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
        } else {
            const response: ServiceCRUDResponse = {
                requestFriendList: requestAccountDetails["blocked_users"],
                recipientFriendList: recipientAccountDetails["blocked_users"]
            }

            return this._generalUtility.genericResponse(true, response);
        }
    }

    private async updateDatabaseLists(requestUsername: string, recipientUsername: string, requestList: IChatUser[]
                                      , recipientList: IChatUser[], msg: string, friend_list: boolean): Promise<IGenericResponse> {
        return await this._mongoService.handleConnection
        (async (): Promise<IGenericResponse> => {
            const requestQuery = { username: requestUsername };
            const recipientQuery = { username: recipientUsername };
            let requestUpdate: {};

            let recipientUpdate: {};

            if(friend_list) {
                requestUpdate = {
                    $set: {
                        friend_list: requestList
                    }
                }

                recipientUpdate = {
                    $set: {
                        friend_list: recipientList
                    }
                }
            } else {
                requestUpdate = {
                    $set: {
                        blocked_users: requestList
                    }
                }

                recipientUpdate = {
                    $set: {
                        blocked_users: recipientList
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

            response = await this._mongoService.updateOne(recipientQuery, recipientUpdate, ECollection.users);
            if(!response["status"]) {
                if(friend_list) {
                    return this._generalUtility.genericResponse(false, FriendServiceMessages.UNABLE_UPDATE_FRIEND_RECIPIENT, 400);
                }

                return this._generalUtility.genericResponse(false, FriendServiceMessages.UNABLE_UPDATE_BLOCKED_RECIPIENT, 400);
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
                        username: requestUsername,
                        recipient_username: recipientUsername
                    });
                    break;
                case FriendServiceMessages.UNBLOCK_USER_SUCCESS:
                    await this._logService.addLog({
                        timestamp: new Date(Date.now()),
                        event: ELogServiceEvent.FRIEND_UNBLOCK_USER,
                        username: requestUsername,
                        recipient_username: recipientUsername
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

        if(requestFriendList.includes(recipient_user) || recipientFriendList.includes(request_user)) {
            return this._generalUtility.genericResponse(false, FriendServiceMessages.USER_ALREADY_FRIEND, 400);
        }

        requestFriendList.push(recipient_user);
        recipientFriendList.push(request_user);

        return this.updateDatabaseLists(request_user["username"], recipient_user["username"], requestFriendList
            , recipientFriendList, FriendServiceMessages.ADD_FRIEND_SUCCESS, true);
    }

    async removeFriend(request_user: IChatUser, recipient_user: IChatUser): Promise<IGenericResponse> {
        const serviceCRUDChecks: IGenericResponse = await this.serviceCRUDChecks(request_user, recipient_user, FriendServiceMessages.CANNOT_REMOVE_YOURSELF, true);
        if(!serviceCRUDChecks) {
            return serviceCRUDChecks;
        }

        let requestFriendList: IChatUser[] = (serviceCRUDChecks["result"] as ServiceCRUDResponse)["requestFriendList"]  as IChatUser[];
        let recipientFriendList: IChatUser[] = (serviceCRUDChecks["result"] as ServiceCRUDResponse)["recipientFriendList"] as IChatUser[];

        if(!requestFriendList.includes(recipient_user) || !recipientFriendList.includes(request_user)) {
            return this._generalUtility.genericResponse(false, FriendServiceMessages.USER_NOT_FRIEND, 400);
        }

        const requestFLSet: Set<IChatUser> = new Set(requestFriendList);
        const recipientFLSet: Set<IChatUser> = new Set(recipientFriendList);

        requestFLSet.delete(recipient_user);
        recipientFLSet.delete(request_user);

        requestFriendList = Array.from(requestFLSet);
        recipientFriendList = Array.from(recipientFLSet);

        return this.updateDatabaseLists(request_user["username"], recipient_user["username"], requestFriendList
            , recipientFriendList, FriendServiceMessages.REMOVE_FRIEND_SUCCESS, true);
    }

    async blockFriend(request_user: IChatUser, recipient_user: IChatUser): Promise<IGenericResponse> {
        const serviceCRUDChecks: IGenericResponse = await this.serviceCRUDChecks(request_user, recipient_user, FriendServiceMessages.CANNOT_BLOCK_YOURSELF, false);
        if(!serviceCRUDChecks) {
            return serviceCRUDChecks;
        }

        const requestBlockedUsers: IChatUser[] = (serviceCRUDChecks["result"] as ServiceCRUDResponse)["requestBlockedUsers"] as IChatUser[];
        const recipientBlockedUsers: IChatUser[] = (serviceCRUDChecks["result"] as ServiceCRUDResponse)["recipientBlockedUsers"] as IChatUser[];

        if(requestBlockedUsers.includes(recipient_user) || recipientBlockedUsers.includes(request_user)) {
            return this._generalUtility.genericResponse(false, FriendServiceMessages.USER_ALREADY_BLOCKED, 400);
        }

        requestBlockedUsers.push(recipient_user);
        recipientBlockedUsers.push(request_user);

        return this.updateDatabaseLists(request_user["username"], recipient_user["username"], requestBlockedUsers
            , recipientBlockedUsers, FriendServiceMessages.BLOCK_USER_SUCCESS, false);
    }

    async unblockFriend(request_user: IChatUser, recipient_user: IChatUser): Promise<IGenericResponse> {
        const serviceCRUDChecks: IGenericResponse = await this.serviceCRUDChecks(request_user, recipient_user, FriendServiceMessages.CANNOT_UNBLOCK_YOURSELF, false);
        if(!serviceCRUDChecks) {
            return serviceCRUDChecks;
        }

        let requestBlockedUsers: IChatUser[] = (serviceCRUDChecks["result"] as ServiceCRUDResponse)["requestBlockedUsers"] as IChatUser[];
        let recipientBlockedUsers: IChatUser[] = (serviceCRUDChecks["result"] as ServiceCRUDResponse)["recipientBlockedUsers"] as IChatUser[];

        if(!requestBlockedUsers.includes(recipient_user) || !recipientBlockedUsers.includes(request_user)) {
            return this._generalUtility.genericResponse(false, FriendServiceMessages.USER_ALREADY_UNBLOCKED, 400);
        }

        const requestBLSet: Set<IChatUser> = new Set(requestBlockedUsers);
        const recipientBLSet: Set<IChatUser> = new Set(recipientBlockedUsers);

        requestBLSet.delete(recipient_user);
        recipientBLSet.delete(request_user);

        requestBlockedUsers = Array.from(requestBLSet);
        recipientBlockedUsers = Array.from(recipientBLSet);

        return this.updateDatabaseLists(request_user["username"], recipient_user["username"], requestBlockedUsers
            , recipientBlockedUsers, FriendServiceMessages.UNBLOCK_USER_SUCCESS, false);
    }
}