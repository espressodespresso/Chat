import {createSignal, JSXElement, onMount} from "solid-js";
import {useNavigate} from "@solidjs/router";
import {IAuthService} from "../../interfaces/AuthService.interface.ts";
import {authServiceInstance} from "../../services/singleton/AuthModule.ts";

export default function AuthEnforce(): JSXElement {
    const authService: IAuthService = authServiceInstance;
    const navigate = useNavigate();

    onMount(() => {
        if(!authService.authStatus) {
            navigate("/login", {replace: true});
        }
    })

    return null;
}