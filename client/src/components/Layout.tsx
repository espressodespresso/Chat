import {LayoutProps} from "../interfaces/props/Layout.props.js";
import Navbar from "./nav/Navbar.js";

export default function Layout(props: LayoutProps) {
    return (
        <>
            <header>
                <Navbar />
            </header>
            <main>
                {props["children"]}
            </main>
        </>
    )
}