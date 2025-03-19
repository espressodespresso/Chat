export interface IGeneralUtility {
    generateID(): string;
}

export class GeneralUtility implements IGeneralUtility {
    private static _instance: GeneralUtility | null = null;

    private constructor() {}

    static getInstance(): GeneralUtility {
        if(this._instance === null) {
            this._instance = new GeneralUtility();
        }

        return this._instance;
    }

    generateID(): string {
        const chars: string =  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let id: string = "";
        for (let i = 0; i < 25; i++) {
            id = chars.charAt(Math.floor(Math.random() * chars.length));
        }

        return id;
    }
}