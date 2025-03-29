import {IAuthService} from "../../interfaces/AuthService.interface.js";
import {createSignal, Signal} from "solid-js";

export class AuthService implements IAuthService {
    private static _instance: AuthService | null = null;
    private _authStatus: Signal<boolean> = createSignal(false);

    private constructor() { }

    static getInstance(): AuthService {
        if (this._instance === null) {
            this._instance = new AuthService();
        }

        return this._instance;
    }

    get AuthStatus(): () => boolean{
        return this._authStatus[0];
    }

    set AuthStatus(value: boolean) {
        this._authStatus[1](value);
    }

}