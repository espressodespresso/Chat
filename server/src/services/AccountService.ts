import {IMongoService, MongoResponse} from "./MongoService";
import {ServiceFactory} from "./ServiceFactory";
import {IGeneralUtility, IGenericResponse} from "../utility/General.utility";
import {generalUtility} from "../utility/UtilityModule";
import {ECollection} from "../enums/Collection.enum";
import {ILogService} from "./LogService";
import {ELogServiceEvent} from "../enums/LogEvent.enum";
import {hash} from "bcrypt-ts";


export interface IChatDetails {
    chat_id: string;
    user_id: string;
    username: string;
    date_added: Date;
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
    friend_list: IChatDetails[];
    last_seen: Date;
    online: boolean;
    options: IUserOptions;
}

export interface IAccountService {
    createAccount(username: string, password: string, email: string): Promise<IGenericResponse>;
    getAccountDetails(username: string): Promise<IGenericResponse>;
}

const AccountServiceMessages = {
    ACCOUNT_EXISTS: "Account with credentials already exists.",
    SIGNUP_SUCCESS: "User created successfully.",
    SIGNUP_FAILURE: "Unable to create account."
}

const ValidationMessages = {
    USERNAME_SHORT: "Username entered too short.",
    USERNAME_LONG: "Username entered too long.",
    PASSWORD_SHORT: "Password entered too short.",
    PASSWORD_LONG: "Password entered too long.",
    EMAIL_INVALID: "Email is not a valid email address.",
    INVALID_CHARACTER_USER: "Username included an invalid character ",
    INVALID_CHARACTER_PASS: "Password included an invalid character ",
    USERNAME_UNDEFINED: "Username is not specified.",
    PASSWORD_UNDEFINED: "Password is not specified.",
    EMAIL_UNDEFINED: "Email is not specified."
}

export class AccountService implements IAccountService {
    private _mongoService: IMongoService;
    private _generalUtility: IGeneralUtility;
    private _logService: ILogService;

    constructor() {
        this._mongoService = ServiceFactory.createMongoService();
        this._generalUtility = generalUtility;
        this._logService = ServiceFactory.createLogService();
    }

    async createAccount(username: string, password: string, email: string): Promise<IGenericResponse> {
        const inputValidationResponse: IGenericResponse = this.inputValidation(username, password, email);
        if(!inputValidationResponse["status"]) {
            return inputValidationResponse;
        }

        const defaultData: IUserDetails = {
            user_id: this._generalUtility.generateID(),
            username: username,
            password: await hash(password, 10),
            email: email,
            friend_list: [],
            last_seen: new Date(Date.now()),
            online: false,
            options: {
                theme: false,
                display_name: username
            }
        }

        const findUserDetails: IGenericResponse = await this.getAccountDetails(username);
        if(findUserDetails["result"]) {
            return this._generalUtility.genericResponse(false, AccountServiceMessages.ACCOUNT_EXISTS, 409);
        }

        const response: MongoResponse = await this._mongoService.handleConnection
        (async (): Promise<MongoResponse> => {
            return await this._mongoService.insertOne(defaultData, ECollection.users);
        })

        if(response["status"]) {
            await this._logService.addLog({
                timestamp: new Date(Date.now()),
                event: ELogServiceEvent.USER_SIGNUP,
                username: username
            });

            return this._generalUtility.genericResponse(true, AccountServiceMessages.SIGNUP_SUCCESS, 200);
        }

        return this._generalUtility.genericResponse(false, AccountServiceMessages.SIGNUP_FAILURE, 401);
    }

    async getAccountDetails(username: string): Promise<IGenericResponse>  {
        const response: MongoResponse = await this._mongoService.handleConnection
        (async (): Promise<MongoResponse> => {
            const query = { username: username };
            return await this._mongoService.findOne(query, ECollection.users);
        })

        if(response["status"]) {
            return this._generalUtility.genericResponse(true, response["result"]);
        }

        return this._generalUtility.genericResponse(false, null);
    }

    private inputValidation(username: string, password: string, email: string): IGenericResponse {
        switch (true) {
            case username === undefined:
                return this._generalUtility.genericResponse(false, ValidationMessages.USERNAME_UNDEFINED, 400);
            case password === undefined:
                return this._generalUtility.genericResponse(false, ValidationMessages.PASSWORD_UNDEFINED, 400);
            case email === undefined:
                return this._generalUtility.genericResponse(false, ValidationMessages.EMAIL_UNDEFINED, 400);
        }

        const emailChars: string[] = email.split('');
        switch (true) {
            case username.length < 6:
                return this._generalUtility.genericResponse(false, ValidationMessages.USERNAME_SHORT, 400);
            case username.length > 30:
                return this._generalUtility.genericResponse(false, ValidationMessages.USERNAME_LONG, 400);
            case password.length < 8:
                return this._generalUtility.genericResponse(false, ValidationMessages.PASSWORD_SHORT, 400);
            case password.length > 50:
                return this._generalUtility.genericResponse(false, ValidationMessages.PASSWORD_LONG, 400);
            case email.length < 6 || email.length > 50 || !emailChars.includes("@"):
                return this._generalUtility.genericResponse(false, ValidationMessages.EMAIL_INVALID, 400);
        }

        const invalidCharsUsername: string[] = ["@", ":", "/", "\\", "#", "?", "&", "=", "'", '"', ">", "<", "*", "|", "~", " "];
        const invalidCharsPassword: string[] = ["\\", "'", '"'," "];
        for (let i = 0; i < invalidCharsUsername.length; i++) {
            const char: string = invalidCharsUsername[i];
            if(username.split('').includes(char)) {
                return this._generalUtility.genericResponse(false, `${ValidationMessages.INVALID_CHARACTER_USER} ${char}.`, 400);
            }
        }

        for (let i = 0; i < invalidCharsPassword.length; i++) {
            const char: string = invalidCharsPassword[i];
            if(password.split('').includes(char)) {
                return this._generalUtility.genericResponse(false, `${ValidationMessages.INVALID_CHARACTER_PASS} ${char}.`, 400);
            }

            if(emailChars.includes(char)) {
                return this._generalUtility.genericResponse(false, ValidationMessages.EMAIL_INVALID, 400);
            }
        }

        return this._generalUtility.genericResponse(true, null, 200);
    }
}