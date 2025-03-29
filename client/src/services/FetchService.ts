import {IFetchService} from "../interfaces/FetchService.interface.js";
import {GenericResponse} from "@shared/types/GenericResponse.types.ts";


export class FetchService implements IFetchService {
    async get(route: string, body: JSON): Promise<GenericResponse> {
        const response = await fetch(`${import.meta.env.API_ADDRESS}${route}`, {
            method: "GET",
            headers: {"Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("access_token")}`},
            body: JSON.stringify(body)
        });

        return response.json();
    }
}