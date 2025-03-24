import {IChatUser} from "../ChatService.interface";
import {IUserDetails, IUserOptions} from "../AccountService.interface";

export interface GetAccountDetailsRequest {
    user: IChatUser
}

export interface UpdateAccountDetailsRequest {
    user_data: IUserDetails
}

export interface UpdateAccountOptionsRequest {
    user: IChatUser,
    data: IUserOptions
}