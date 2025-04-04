import {Accessor} from "solid-js";
import {EButtonSVG} from "../../../enums/ButtonSVG.enum.ts";

export interface NavButtonProps {
    getLoading: Accessor<boolean>,
    handleClick: () => Promise<void>,
    title: string,
    icon: EButtonSVG
}