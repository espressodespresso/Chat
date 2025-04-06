import Layout from "../components/Layout.js";
import AuthEnforce from "../components/auth/AuthEnforce.tsx";
import {IAuthService} from "../interfaces/AuthService.interface.ts";
import {authServiceInstance} from "../services/singleton/AuthModule.ts";
import {AuthResponse} from "@shared/types/AuthResponse.types.ts";
import {useNavigate} from "@solidjs/router";
import {createSignal, onMount} from "solid-js";
import {IAccountService} from "../interfaces/AccountService.interface.ts";
import {ServiceFactory} from "../services/ServiceFactory.ts";
import {GenericResponse} from "@shared/types/GenericResponse.types.ts";
import {UserDetails} from "@shared/types/UserDetails.types.ts";
import {ChatUser} from "@shared/types/ChatUser.types.ts";

const authService: IAuthService = authServiceInstance;
const accountService: IAccountService = ServiceFactory.createAccountService();

export default function Home() {
    const [getLoading, setLoading] = createSignal(false);
    const [getChatUser, setChatUser] = createSignal("None");
    let friendListElement: HTMLUListElement | undefined;
    const navigate = useNavigate();

    const handleLogout = async () => {
        const response: AuthResponse = await authServiceInstance.logout();
        if(response["status"]) {
            navigate("/login", {replace: true});
        }
    }

    onMount(async () => {
        const response: GenericResponse = await accountService.getAccountDetails();
        if(response["status"] && friendListElement) {
            const data: UserDetails = response["result"] as UserDetails;
            const friend_list: ChatUser[] = data["friend_list"];
            if(friend_list.length === 0) {

            } else {
                for(let i = 0; i < friend_list.length; i++) {
                    const friend: ChatUser = friend_list[i];
                    const response: GenericResponse = await accountService.getAccountUsername(friend["user_id"]);
                    if(response["status"]) {
                        const li: HTMLLIElement = document.createElement("li");
                        li.textContent = response["result"] as string;
                        friendListElement.appendChild(li);
                    }
                }
            }

            setLoading(true);
        }
    })

    return (
        <>
            <AuthEnforce/>
            <Layout id="homePage" />
            <aside class="fixed left-0 top-40 text-white">
                <div class="grid grid-cols-[1fr_3fr] place-items-center w-dvw text-center">
                    <div class="homeCard w-[95%] h-[calc(99vh-10rem)] rounded-xl">
                        <h1 class="font-bold">Friend List</h1>
                        <ul ref={friendListElement}>

                        </ul>
                    </div>
                    <div class="homeCard w-[95%] h-[calc(99vh-10rem)] rounded-xl">
                        <h1 class="font-bold">Chat with {getChatUser()}</h1>
                    </div>
                </div>
            </aside>
            <aside class="fixed left-0 top-0 w-dvw h-dvh flex place-items-center justify-center homeCard text-white" hidden={getLoading()}>
                <span class="spinner"></span>
            </aside>
        </>
    )
}