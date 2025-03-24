import {IChatUser} from "./ChatService.interface";
import {IGenericResponse} from "./utility/General.interface";

export interface IAccountService {
    createAccount(username: string, password: string, email: string): Promise<IGenericResponse>;
    getAccountDetails(username: string): Promise<IGenericResponse>;
    updateAccountDetails(data: IUserDetails): Promise<IGenericResponse>;
    getAccountsDetails(usernames: string[]): Promise<IGenericResponse>;
    updateUserOptions(username: string, data: IUserOptions): Promise<IGenericResponse>
}

export interface IUserOptions {
    theme: boolean;
    display_name: string;
}

export interface IUserDetails {
    user_id: string;
    username: string;
    password: string;
    email: string;
    chat_list: string[];
    friend_list: IChatUser[];
    blocked_users: IChatUser[];
    last_seen: Date;
    online: boolean;
    options: IUserOptions;
}