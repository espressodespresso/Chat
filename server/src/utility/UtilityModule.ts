import {GeneralUtility} from "./General.utility";
import {IGeneralUtility, IGenericResponse} from "../interfaces/utility/General.interface";

export const generalUtilityInstance: IGeneralUtility = GeneralUtility.getInstance();
export const invalidDataObj: IGenericResponse = generalUtilityInstance.genericResponse(false, "Invalid request data", 400);