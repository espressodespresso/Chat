import {AuthButtonProps} from "../../interfaces/props/AuthButton.props.ts";

export default function AuthButton(props: AuthButtonProps) {
    return (
        <button type="submit"
                class="w-full rounded-md p-2 m-1 font-bold text-md hover:font-stretch-105% transition-transform"
                onClick={props["handleAuthClick"]}>
            {props["getLoading"]() ? "Validating..." : props["buttonText"]}
        </button>
    )
}