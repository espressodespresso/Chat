import {NavButtonProps} from "../../interfaces/props/nav/NavButton.props.ts";
import {EButtonSVG} from "../../enums/ButtonSVG.enum.ts";

export default function NavButton(props: NavButtonProps) {
    const svgSelector = () => {
        switch (props["icon"]) {
            case EButtonSVG.PROFILE:
                return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                            stroke="#eff6ff" class="size-8">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
                </svg>;
            case EButtonSVG.LOGOUT:
                return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                            stroke="#eff6ff" class="size-8">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"/>
                </svg>;
            case EButtonSVG.SETTINGS:
                return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                            stroke="#eff6ff" class="size-8">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M21.75 6.75a4.5 4.5 0 0 1-4.884 4.484c-1.076-.091-2.264.071-2.95.904l-7.152 8.684a2.548 2.548 0 1 1-3.586-3.586l8.684-7.152c.833-.686.995-1.874.904-2.95a4.5 4.5 0 0 1 6.336-4.486l-3.276 3.276a3.004 3.004 0 0 0 2.25 2.25l3.276-3.276c.256.565.398 1.192.398 1.852Z"/>
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M4.867 19.125h.008v.008h-.008v-.008Z"/>
                </svg>;
        }
    }

    return (
        <div class={`place-items-center cursor-pointer ${props["getLoading"]() ? "cursor-wait" : ""}`}
             onClick={props["handleClick"]}>
            {svgSelector()}
            <a class="font-light">{props["title"]}</a>
        </div>
    )
}