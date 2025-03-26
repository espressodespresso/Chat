import {IChatUser} from "./ChatService.interface";
import {IGenericResponse} from "./utility/General.interface";

export interface IFriendService {
    addFriend(request_user: IChatUser, recipient_user: IChatUser): Promise<IGenericResponse>;
    removeFriend(request_user: IChatUser, recipient_user: IChatUser): Promise<IGenericResponse>;
    blockFriend(request_user: IChatUser, recipient_user: IChatUser): Promise<IGenericResponse>;
    unblockFriend(request_user: IChatUser, recipient_user: IChatUser): Promise<IGenericResponse>;
}

export interface ServiceCRUDResponse {
    requestFriendList?: IChatUser[];
    recipientFriendList?: IChatUser[];
    requestBlockedUsers?: IChatUser[];
}