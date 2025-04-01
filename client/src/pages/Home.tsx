import Layout from "../components/Layout.js";
import AuthEnforce from "../components/auth/AuthEnforce.tsx";
import {IAuthService} from "../interfaces/AuthService.interface.ts";
import {authServiceInstance} from "../services/singleton/AuthModule.ts";
import {AuthResponse} from "@shared/types/AuthResponse.types.ts";
import {useNavigate} from "@solidjs/router";

const authService: IAuthService = authServiceInstance;

export default function Home() {
    const navigate = useNavigate();

    const handleLogout = async () => {
        const response: AuthResponse = await authServiceInstance.logout();
        if(response["status"]) {
            navigate("/login", {replace: true});
        }
    }

    return (
        <>
            <AuthEnforce/>
            <Layout id="HomePage">
                <div class="grid grid-cols-1 place-items-center">
                    <h1>Hello - Home</h1>
                    <button type="submit"
                            class="w-40 bg-amber-200 rounded-md p-2 m-1 font-bold text-md hover:font-stretch-105% transition-transform"
                            onClick={handleLogout}>
                        Logout Test
                    </button>
                </div>
            </Layout>
        </>
    )
}