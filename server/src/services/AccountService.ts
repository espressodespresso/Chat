import {ServiceFactory} from "./ServiceFactory";
import {generalUtilityInstance} from "../utility/UtilityModule";
import {ECollection} from "../enums/Collection.enum";
import {ELogServiceEvent} from "../enums/LogEvent.enum";
import {hash} from "bcrypt-ts";
import {IMongoService, MongoResponse} from "../interfaces/MongoService.interface";
import {ILogService} from "../interfaces/LogService.interface";
import {IAccountService, IUserDetails, IUserOptions} from "../interfaces/AccountService.interface";
import {IGeneralUtility, IGenericResponse} from "../interfaces/utility/General.interface";

const AccountServiceMessages = {
    ACCOUNT_EXISTS: "Account with credentials already exists.",
    SIGNUP_SUCCESS: "User created successfully.",
    SIGNUP_FAILURE: "Unable to create account.",
    UPDATE_DETAILS_FAILURE: "Unable to update account details.",
    UPDATE_DETAILS_SUCCESS: "Account details updated successfully.",
    UPDATE_OPTIONS_FAILURE: "Unable to update account options.",
    UPDATE_OPTIONS_SUCCESS: "Account options updated successfully.",
    GET_DETAILS_FAILURE: "Unable to gather account details successfully."
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
        this._generalUtility = generalUtilityInstance;
        this._logService = ServiceFactory.createLogService();
    }

    async createAccount(username: string, password: string, email: string): Promise<IGenericResponse> {
        const inputValidationResponse: IGenericResponse = this.inputValidation(username, password, email);
        if(!inputValidationResponse["status"]) {
            return inputValidationResponse;
        }

        const user_id: string = this._generalUtility.generateID();
        const defaultData: IUserDetails = {
            user_id: user_id,
            username: username,
            password: await hash(password, 10),
            email: email,
            chat_list: [],
            friend_list: [],
            blocked_users: [],
            last_seen: new Date(Date.now()),
            online: false,
            options: {
                theme: false,
                display_name: username
            }
        }

        const findUserDetails: IGenericResponse = await this.getAccountDetailsByUsername(username);
        if(findUserDetails["status"]) {
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
                user_id: user_id
            });

            return this._generalUtility.genericResponse(true, AccountServiceMessages.SIGNUP_SUCCESS, 200);
        }

        return this._generalUtility.genericResponse(false, AccountServiceMessages.SIGNUP_FAILURE, 401);
    }

    async getUserIDByUsername(username: string): Promise<IGenericResponse> {
        const response: MongoResponse = await this._mongoService.handleConnection
        (async (): Promise<MongoResponse> => {
            const query = { username: username };
            return await this._mongoService.findOne(query, ECollection.users);
        })

        if(response["status"]) {
            return this._generalUtility.genericResponse(true, (response["result"] as IUserDetails)["user_id"]);
        }

        return this._generalUtility.genericResponse(false, null);
    }

    async getUsernameByUserID(user_id: string): Promise<IGenericResponse> {
        const response: MongoResponse = await this._mongoService.handleConnection
        (async (): Promise<MongoResponse> => {
            const query = { user_id: user_id };
            return await this._mongoService.findOne(query, ECollection.users);
        })

        if(response["status"]) {
            return this._generalUtility.genericResponse(true, (response["result"] as IUserDetails)["username"]);
        }

        return this._generalUtility.genericResponse(false, null);
    }

    async getAccountDetailsByID(user_id: string): Promise<IGenericResponse>  {
        const response: MongoResponse = await this._mongoService.handleConnection
        (async (): Promise<MongoResponse> => {
            const query = { user_id: user_id };
            return await this._mongoService.findOne(query, ECollection.users);
        })

        if(response["status"]) {
            await this._logService.addLog({
                timestamp: new Date(Date.now()),
                event: ELogServiceEvent.ACCOUNT_DETAILS,
                user_id: user_id
            });

            return this._generalUtility.genericResponse(true, response["result"], 200);
        }

        return this._generalUtility.genericResponse(false, AccountServiceMessages.GET_DETAILS_FAILURE, 400);
    }

    async getAccountDetailsByUsername(username: string): Promise<IGenericResponse>  {
        const response: MongoResponse = await this._mongoService.handleConnection
        (async (): Promise<MongoResponse> => {
            const query = { username: username };
            return await this._mongoService.findOne(query, ECollection.users);
        })

        if(response["status"]) {
            await this._logService.addLog({
                timestamp: new Date(Date.now()),
                event: ELogServiceEvent.ACCOUNT_DETAILS,
                user_id: response["result"]["user_id"],
            });

            return this._generalUtility.genericResponse(true, response["result"], 200);
        }

        return this._generalUtility.genericResponse(false, AccountServiceMessages.GET_DETAILS_FAILURE, 400);
    }

    async getAccountsDetails(user_ids: string[]): Promise<IGenericResponse>  {
        return await this._mongoService.handleConnection
        (async (): Promise<IGenericResponse> => {
            const accountsDetails: IUserDetails[] = [];
            for(let i = 0; i < user_ids.length; i++) {
                const user_id = user_ids[i];
                const query = { user_id: user_id };
                const response: MongoResponse = await this._mongoService.findOne(query, ECollection.users);
                if(response["status"]) {
                    accountsDetails.push(response["result"]);
                }
            }

            if(accountsDetails.length <= 1) {
                return this._generalUtility.genericResponse(false, null);
            }

            await this._logService.addLog({
                timestamp: new Date(Date.now()),
                event: ELogServiceEvent.ACCOUNTS_DETAILS,
            });

            return this._generalUtility.genericResponse(true, accountsDetails);
        })
    }

    async updateAccountDetails(data: IUserDetails): Promise<IGenericResponse> {
        const user_id: string = data["user_id"];
        const inputValidationResponse: IGenericResponse = this.inputValidation(data["username"], data["password"], data["email"]);
        if(!inputValidationResponse["status"]) {
            return inputValidationResponse;
        }

        const response: MongoResponse = await this._mongoService.handleConnection
        (async (): Promise<MongoResponse> => {
            const query = { user_id: user_id };
            const response: MongoResponse = await this._mongoService.findOne(query, ECollection.users);
            if(!response["status"]) {
                return this._generalUtility.genericResponse(false, AccountServiceMessages.ACCOUNT_EXISTS, 400);
            }

            return await this._mongoService.insertOne(data, ECollection.users);
        })

        if(response["status"]) {
            await this._logService.addLog({
                timestamp: new Date(Date.now()),
                event: ELogServiceEvent.ACCOUNT_UPDATE_DETAILS,
                user_id: user_id
            });

            return this._generalUtility.genericResponse(true, AccountServiceMessages.SIGNUP_SUCCESS, 200);
        }

        return this._generalUtility.genericResponse(false, AccountServiceMessages.UPDATE_DETAILS_FAILURE, 400);
    }

    async updateUserOptions(user_id: string, data: IUserOptions): Promise<IGenericResponse> {
        const response: MongoResponse = await this._mongoService.handleConnection
        (async (): Promise<MongoResponse> => {
            const query = { user_id: user_id };
            const response: MongoResponse = await this._mongoService.findOne(query, ECollection.users);

            if(!response["status"]) {
                return this._generalUtility.genericResponse(false, AccountServiceMessages.ACCOUNT_EXISTS, 400);
            }

            const update = {
                $set: {
                    options: data
                }
            };

            return await this._mongoService.updateOne(query, update, ECollection.users);
        });

        if(response["status"]) {
            await this._logService.addLog({
                timestamp: new Date(Date.now()),
                event: ELogServiceEvent.ACCOUNT_UPDATE_OPTIONS,
                user_id: user_id
            });

            return this._generalUtility.genericResponse(true, AccountServiceMessages.UPDATE_OPTIONS_SUCCESS, 200);
        }

        return this._generalUtility.genericResponse(false, AccountServiceMessages.UPDATE_OPTIONS_FAILURE, 200);
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