import {MongoClient} from "mongodb";
import {Collection} from "../enums/Collection.enum";

export interface IMongoService {
    findOne(query: object, collection: Collection): Promise<object>;
    findall(collection: Collection): Promise<object>;
    insertOne(data: object, collection: Collection): Promise<object>;
    deleteOne(query: object, collection: Collection): Promise<object>;
    deleteMany(query: object, collection: Collection): Promise<object>;
    updateOne(filter: object, data: object, collection: Collection): Promise<object>;
    updateMany(filter: object, data: object, collection: Collection): Promise<object>;
    replaceOne(query: object, replacement: object, collection: Collection): Promise<object>;
    handleConnection(innerFunc: (...args: any[]) => any): Promise<any>;
    get mongoClient(): MongoClient;
}

export interface MongoResponse {
    status: boolean;
    result: any;
}

export class MongoService implements IMongoService {
    private _client = new MongoClient(process.env.MONGODB_URI as string);
    private _database = this._client.db('database');
    private _usersCollection = this._database.collection('users');

    private getCollection(collection: Collection): any {
        switch (collection) {
            case Collection.users:
                return this._usersCollection;
        }
    }

    private objResponse(status: boolean, result: any): MongoResponse {
        return {
            status: status,
            result: result
        }
    }

    async findOne(query: object, collection: Collection): Promise<MongoResponse> {
        const result = await this.getCollection(collection).findOne(query);
        if(result === null) {
            return this.objResponse(false, null);
        }

        return this.objResponse(true, result);
    }

    async findall(collection: Collection): Promise<MongoResponse> {
        const result = await this.getCollection(collection).find({}).toArray();
        if(result === null) {
            return this.objResponse(false, null);
        }

        return this.objResponse(true, result);
    }

    async insertOne(data: object, collection: Collection): Promise<MongoResponse> {
        const result = await this.getCollection(collection).insertOne(data);
        if(!result.acknowledged) {
            return this.objResponse(false, null);
        }

        return this.objResponse(true, result);
    }

    async deleteOne(query: object, collection: Collection): Promise<MongoResponse> {
        const result = await this.getCollection(collection).deleteOne(query);
        if(result.deletedCount !== 1) {
            return this.objResponse(false, null);
        }

        return this.objResponse(true, result);
    }

    async deleteMany(query: object, collection: Collection): Promise<MongoResponse> {
        const result = await this.getCollection(collection).deleteMany(query);
        if(!result.acknowledged) {
            return this.objResponse(false, null);
        }

        return this.objResponse(true, result);
    }

    async updateOne(filter: object, data: object, collection: Collection): Promise<MongoResponse> {
        const result = await this.getCollection(collection).updateOne(filter, data);
        if(result.modifiedCount !== 1) {
            return this.objResponse(false, null);
        }

        return this.objResponse(true, result);
    }

    async updateMany(filter: object, data: object, collection: Collection): Promise<MongoResponse> {
        const result = await this.getCollection(collection).updateMany(filter, data);
        if(!result.acknowledged) {
            return this.objResponse(false, null);
        }

        return this.objResponse(true, result);
    }

    async replaceOne(query: object, replacement: object, collection: Collection): Promise<MongoResponse> {
        const result = await this.getCollection(collection).replaceOne(query, replacement);
        if(!result.acknowledged) {
            return this.objResponse(false, null);
        }

        return this.objResponse(true, result);
    }

    async handleConnection(innerFunc: (...args: any[]) => any): Promise<any> {
        try {
            await this._client.connect();
            return await innerFunc();
        } catch (e) {
            console.log(e);
        } finally {
            await this._client.close();
        }
    }

    get mongoClient(): MongoClient {
        return this._client;
    }
}