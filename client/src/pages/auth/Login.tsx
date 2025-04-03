import {A, useNavigate} from "@solidjs/router";
import logo from "../../assets/logo.svg";
import {IAuthService} from "../../interfaces/AuthService.interface.ts";
import {createSignal, onMount, Signal} from "solid-js";
import {authServiceInstance} from "../../services/singleton/AuthModule.ts";
import {AuthResponse} from "@shared/types/AuthResponse.types.ts";
import AuthLayout from "../../components/auth/AuthLayout.tsx";
import AuthInput from "../../components/auth/AuthInput.tsx";
import AuthButton from "../../components/auth/AuthButton.tsx";
import AuthRedirect from "../../components/auth/AuthRedirect.tsx";

const authService: IAuthService = authServiceInstance;

export default function Login() {
    const [getUsername, setUsername] = createSignal("");
    const [getPassword, setPassword] = createSignal("");
    const [getLoading, setLoading] = createSignal(false);
    const [getStatusMessage, setStatusMessage] = createSignal("‎");
    const [getStatus, setStatus] = createSignal(false);
    const navigate = useNavigate();

    const handeLogin = async () => {
        setLoading(true);
        let response: AuthResponse;
        try {
            response = await authService.authenticate(getUsername(), getPassword())
            setStatus(response["status"]);
            setStatusMessage(response["message"]);
        } finally {
            setLoading(false);
        }

        if(response["status"]) {
            navigate("/", {replace: true})
        }
    }

    onMount(async () => {
        const response: AuthResponse = await authService.getAuthStatus();
        if(response["status"]) {
            navigate("/", {replace: true});
        }
    })

    return (
        <AuthLayout id="loginPage">
            <h1 class="text-3xl font-bold">Chat App</h1>
            <h3 class="text-xl font-light">Please enter your login credentials below</h3>
            <p class={`font-bold pt-2 ${getStatus() ? "text-green-500" : "text-red-700"}`}>{getStatusMessage()}</p>
            <br/>
            <AuthInput getData={getUsername} setData={setUsername} setStatusMessage={setStatusMessage} name={"username"} placeholder={"Username"} type="text" />
            <AuthInput getData={getPassword} setData={setPassword} setStatusMessage={setStatusMessage} name={"password"} placeholder={"Password"} type="password" />
            <AuthButton handleAuthClick={handeLogin} getLoading={getLoading} buttonText="Login" />
            <br/>
            <br/>
            <AuthRedirect href="/signup" text="Don't have an account?" />
        </AuthLayout>
    )
}