import {A} from "@solidjs/router";
import logo from "../assets/logo.svg";

export default function Auth() {
    return (
        <section id="authPage">
            <div id="loginContainer" class="content-center place-items-center text-center h-dvh">
                <div id="loginCard" class="grid sm:grid-cols-1 md:grid-cols-2 rounded-2xl p-6 text-white border-1 border-cyan-100 m-2">
                    <div class="flex align-middle justify-center">
                        <img class="w-50 m-5 md:m-0" src={logo} alt="logo" />
                    </div>
                    <div>
                        <h1 class="text-3xl font-bold">Chat App</h1>
                        <h3 class="text-xl font-light">Please enter your login credentials below</h3>
                        <br/>
                        <input class="w-full rounded-md p-2 m-1 border-1 border-gray-500" type="text"
                               name="username" placeholder="Username"
                               id="username_input"/>
                        <input class="w-full rounded-md p-2 m-1 border-1 border-gray-500" type="password"
                               name="password" placeholder="Password"
                               id="password_input"/>
                        <br/>
                        <button type="submit"
                                class="w-full rounded-md p-2 m-1 font-bold text-md hover:font-stretch-105% transition-transform">
                            Login
                        </button>
                        <br/>
                        <br/>
                        <A href="/signup" class="inline-flex items-center hover:underline">
                            Don't have an account?
                            <svg class="w-3 h-3 ms-2.5 rtl:rotate-[270deg]" aria-hidden="true"
                                 xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
                                      stroke-width="2"
                                      d="M15 11v4.833A1.166 1.166 0 0 1 13.833 17H2.167A1.167 1.167 0 0 1 1 15.833V4.167A1.166 1.166 0 0 1 2.167 3h4.618m4.447-2H17v5.768M9.111 8.889l7.778-7.778"/>
                            </svg>
                        </A>
                    </div>
                </div>
            </div>
        </section>
    )
}