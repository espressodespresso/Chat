import {ECollection} from "../enums/Collection.enum";
import {MongoClient} from "mongodb";

export interface IMongoService {
    objResponse(status: boolean, result: any): MongoResponse
    findOne(query: object, collection: ECollection): Promise<MongoResponse>;
    findall(collection: ECollection): Promise<MongoResponse>;
    insertOne(data: object, collection: ECollection): Promise<MongoResponse>;
    insertMany(data: any[], collection: ECollection): Promise<MongoResponse>;
    deleteOne(query: object, collection: ECollection): Promise<MongoResponse>;
    deleteMany(query: object, collection: ECollection): Promise<MongoResponse>;
    updateOne(filter: object, data: object, collection: ECollection): Promise<MongoResponse>;
    updateMany(filter: object, data: object, collection: ECollection): Promise<MongoResponse>;
    replaceOne(query: object, replacement: object, collection: ECollection): Promise<MongoResponse>;
    handleTTLIndex(): Promise<void>;
    handleConnection(innerFunc: (...args: any[]) => any): Promise<any>;
    get mongoClient(): MongoClient;
}

export interface MongoResponse {
    status: boolean;
    result: any;
}