import {createSignal, onMount} from "solid-js";
import {IAuthService} from "../../interfaces/AuthService.interface.ts";
import {authServiceInstance} from "../../services/singleton/AuthModule.ts";
import {useNavigate} from "@solidjs/router";
import AuthLayout from "../../components/auth/AuthLayout.tsx";
import AuthInput from "../../components/auth/AuthInput.tsx";
import AuthButton from "../../components/auth/AuthButton.tsx";
import AuthRedirect from "../../components/auth/AuthRedirect.tsx";
import {AuthResponse} from "@shared/types/AuthResponse.types.ts";

const authService: IAuthService = authServiceInstance;

export default function Signup() {
    const [getUsername, setUsername] = createSignal("");
    const [getPassword, setPassword] = createSignal("");
    const [getEmail, setEmail] = createSignal("");
    const [getLoading, setLoading] = createSignal(false);
    const [getStatusMessage, setStatusMessage] = createSignal("‎");
    const [getStatus, setStatus] = createSignal(false);
    const navigate = useNavigate();

    const handleSignup = async () => {

    }

    onMount(async () => {
        const response: AuthResponse = await authService.getAuthStatus();
        if(response["status"]) {
            navigate("/", {replace: true});
        }
    })

    return (
        <AuthLayout id="signupPage">
            <h1 class="text-3xl font-bold">Chat App</h1>
            <h3 class="text-xl font-light">Please enter your desired credentials below</h3>
            <p class={`font-bold pt-2 ${getStatus() ? "text-green-500" : "text-red-700"}`}>{getStatusMessage()}</p>
            <br/>
            <AuthInput getData={getUsername} setData={setUsername} setStatusMessage={setStatusMessage} name={"username"} placeholder={"Username"} type="text" />
            <AuthInput getData={getPassword} setData={setPassword} setStatusMessage={setStatusMessage} name={"password"} placeholder={"Password"} type="password" />
            <AuthInput getData={getEmail} setData={setEmail} setStatusMessage={setStatusMessage} name={"Email"} placeholder={"Email Address"} type="email" />
            <AuthButton handleAuthClick={handleSignup} getLoading={getLoading} buttonText={"Signup"} />
            <br/>
            <br/>
            <AuthRedirect href="/login" text="Already have an account?" />
        </AuthLayout>
    )
}