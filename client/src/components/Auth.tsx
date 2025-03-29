import {createSignal, JSXElement, onMount} from "solid-js";
import {useNavigate} from "@solidjs/router";
import {IAuthService} from "../interfaces/AuthService.interface.js";
import {authServiceInstance} from "../services/singleton/AuthModule.js";

export default function Auth(): JSXElement {
    const authService: IAuthService = authServiceInstance;
    const navigate = useNavigate();

    onMount(() => {
        if(!authService.AuthStatus()) {
            navigate("/auth", {replace: true});
        }
    })

    return null;
}