export enum ELogServiceEvent {
    USER_LOGIN,
    USER_LOGOUT,
    USER_SIGNUP,
    REFRESH_TOKEN,
    SOCKET_OPENED,
    SOCKET_MESSAGE,
    SOCKET_CLOSE

}

export enum ELogRequestEvent {
    POST,
    GET,
    PUT,
    DELETE
}

export enum ELogRouteEvent {
    ACCOUNT,
    AUTH,
    SOCKET
}