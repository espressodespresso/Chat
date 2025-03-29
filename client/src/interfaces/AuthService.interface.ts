export interface IAuthService {
    get AuthStatus(): () => boolean;
    set AuthStatus(value: boolean);
}