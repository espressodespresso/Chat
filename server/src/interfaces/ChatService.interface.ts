import {IGenericResponse} from "../utility/General.utility";

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