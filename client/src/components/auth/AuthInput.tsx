import {AuthInputProps} from "../../interfaces/props/AuthInput.props.ts";

export default function AuthInput(props: AuthInputProps) {
    return (
        <input class="w-full rounded-md p-2 m-1 border-1 border-gray-500" type={props["type"]}
               name={props["name"]} placeholder={props["placeholder"]}
               value={props["getData"]()}
               onInput={(e) => {
                   props["setData"](e["currentTarget"]["value"]);
                   props["setStatusMessage"]("‎");
               }}/>
    )
}