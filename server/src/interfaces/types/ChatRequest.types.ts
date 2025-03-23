import {IChatUser} from "../ChatService.interface";

export interface CreateChatRequest {
    chat_name: string;
    creator_user: IChatUser;
    users: IChatUser[];
}

export interface ChangeChatNameRequest {
    chat_id: string;
    user: IChatUser;
    new_name: string;
}

export interface UserAddRemoveRequest {
    chat_id: string;
    request_user: IChatUser;
    recipient_user: IChatUser;
}

export interface DeleteChatRequest {
    chat_id: string;
    request_user: IChatUser;
}