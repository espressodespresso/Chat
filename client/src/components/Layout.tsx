import {LayoutProps} from "../interfaces/props/Layout.props.js";
import Navbar from "./nav/Navbar.js";

export default function Layout(props: LayoutProps) {
    return (
        <div class="flex flex-col min-h-dvh">
            <header>
                <Navbar />
            </header>
            <main class="flex-1 bg-[#1E2A4A] text-white">
                {props["children"] ? props["children"] : ""}
            </main>
        </div>
    )
}