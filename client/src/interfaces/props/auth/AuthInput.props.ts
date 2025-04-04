import {Accessor, Setter} from "solid-js";

export interface AuthInputProps {
    getData: Accessor<string>,
    setData: Setter<string>,
    setStatusMessage: Setter<string>,
    name: string,
    placeholder: string,
    type: string,
}