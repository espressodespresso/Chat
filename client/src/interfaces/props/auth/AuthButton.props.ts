import {Accessor} from "solid-js";

export interface AuthButtonProps {
    handleAuthClick: () => Promise<void>,
    getLoading: Accessor<boolean>,
    buttonText: string,
}