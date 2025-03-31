import {LayoutProps} from "../../interfaces/props/Layout.props.ts";
import logo from "../../assets/logo.svg";

export default function AuthLayout(props: LayoutProps) {
    return (
        <section id={props["id"]}>
            <div class="authContainer content-center place-items-center text-center h-dvh">
                <div class="authCard grid sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 rounded-2xl p-6 text-white border-1 border-cyan-100 m-2">
                    <div class="flex align-middle justify-center ">
                        <img class="w-50 m-5 md:m-0" src={logo} alt="logo"/>
                    </div>
                    <div class="sm:w-120 md:90 lg:w-120">
                        {props["children"]}
                    </div>
                </div>
            </div>
        </section>
    )
}