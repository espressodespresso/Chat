import {createSignal, JSXElement, onMount} from "solid-js";
import {useNavigate} from "@solidjs/router";
import {IAuthService} from "../../interfaces/AuthService.interface.ts";
import {authServiceInstance} from "../../services/singleton/AuthModule.ts";
import {AuthResponse} from "@shared/types/AuthResponse.types.ts";

export default function AuthEnforce(): JSXElement {
    const authService: IAuthService = authServiceInstance;
    const navigate = useNavigate();

    onMount(async () => {
        const response: AuthResponse = await authService.getAuthStatus();
        if(!response["status"]) {
            navigate("/login", {replace: true});
        }
    })

    return null;
}