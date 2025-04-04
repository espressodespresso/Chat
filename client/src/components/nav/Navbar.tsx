import logo from "../../assets/logo.svg";
import {useNavigate} from "@solidjs/router";
import {AuthResponse} from "@shared/types/AuthResponse.types.ts";
import {authServiceInstance} from "../../services/singleton/AuthModule.ts";
import {createSignal} from "solid-js";
import NavButton from "./NavButton.tsx";
import {EButtonSVG} from "../../enums/ButtonSVG.enum.ts";

export default function Navbar() {
    const navigate = useNavigate();
    const [getLoading, setLoading] = createSignal(false);

    const handleLogout = async () => {
        try {
            setLoading(true);
            const response: AuthResponse = await authServiceInstance.logout();
            if(response["status"]) {
                navigate("/login", {replace: true});
            }
        } finally {
            setLoading(false);
        }
    }

    const handleProfile = async () => {
        console.log("hey")
    }

    const handleSettings = async () => {

    }

    return (
        <section>
            <div class="grid grid-cols-3 bg-[#0e131f] text-blue-50">
                <div class="place-items-start">
                    <div class="grid grid-cols-2">
                        <img class="w-12 m-2" src={logo} alt="logo"/>
                        <h1 class="place-self-center font-bold text-xl">Chat</h1>
                    </div>
                </div>
                <div class="justify-self-center content-center">
                    <input type="search"
                           placeholder="Search"
                           class="rounded-l-xl w-70 bg-black border-2 border-gray-600 text-white p-1"/>
                    <button type="submit"
                            class="rounded-r-xl bg-blue-50 border-2 border-gray-600 pt-1 pb-1 pr-3 pl-3">
                        🔍
                    </button>
                </div>
                <div class="place-items-end">
                    <div class="grid grid-cols-3 gap-4">
                        <NavButton getLoading={getLoading} handleClick={handleLogout} title="Logout" icon={EButtonSVG.LOGOUT} />
                        <NavButton getLoading={getLoading} handleClick={handleProfile} title="Profile" icon={EButtonSVG.PROFILE} />
                        <NavButton getLoading={getLoading} handleClick={handleSettings} title="Settings" icon={EButtonSVG.SETTINGS} />
                    </div>
                </div>
            </div>
            <div class="spacer layer" />
        </section>
    )
}