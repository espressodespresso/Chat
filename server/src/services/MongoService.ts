import {IndexDescription, MongoClient} from "mongodb";
import {ECollection} from "../enums/Collection.enum";

export interface IMongoService {
    objResponse(status: boolean, result: any): MongoResponse
    findOne(query: object, collection: ECollection): Promise<MongoResponse>;
    findall(collection: ECollection): Promise<MongoResponse>;
    insertOne(data: object, collection: ECollection): Promise<MongoResponse>;
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

export class MongoService implements IMongoService {
    private _client = new MongoClient(process.env.MONGODB_URI as string);
    private _database = this._client.db('database');
    private _usersCollection = this._database.collection('users');
    private _tokensCollection = this._database.collection('tokens');

    private getCollection(collection: ECollection): any {
        switch (collection) {
            case ECollection.users:
                return this._usersCollection;
            case ECollection.tokens:
                return this._tokensCollection;

        }
    }

    objResponse(status: boolean, result: any): MongoResponse {
        return {
            status: status,
            result: result
        }
    }

    async findOne(query: object, collection: ECollection): Promise<MongoResponse> {
        const result = await this.getCollection(collection).findOne(query);
        if(result === null) {
            return this.objResponse(false, null);
        }

        return this.objResponse(true, result);
    }

    async findall(collection: ECollection): Promise<MongoResponse> {
        const result = await this.getCollection(collection).find({}).toArray();
        if(result === null) {
            return this.objResponse(false, null);
        }

        return this.objResponse(true, result);
    }

    async insertOne(data: object, collection: ECollection): Promise<MongoResponse> {
        const result = await this.getCollection(collection).insertOne(data);
        if(!result.acknowledged) {
            return this.objResponse(false, null);
        }

        return this.objResponse(true, result);
    }

    async deleteOne(query: object, collection: ECollection): Promise<MongoResponse> {
        const result = await this.getCollection(collection).deleteOne(query);
        if(result.deletedCount !== 1) {
            return this.objResponse(false, null);
        }

        return this.objResponse(true, result);
    }

    async deleteMany(query: object, collection: ECollection): Promise<MongoResponse> {
        const result = await this.getCollection(collection).deleteMany(query);
        if(!result.acknowledged) {
            return this.objResponse(false, null);
        }

        return this.objResponse(true, result);
    }

    async updateOne(filter: object, data: object, collection: ECollection): Promise<MongoResponse> {
        const result = await this.getCollection(collection).updateOne(filter, data);
        if(result.modifiedCount !== 1) {
            return this.objResponse(false, null);
        }

        return this.objResponse(true, result);
    }

    async updateMany(filter: object, data: object, collection: ECollection): Promise<MongoResponse> {
        const result = await this.getCollection(collection).updateMany(filter, data);
        if(!result.acknowledged) {
            return this.objResponse(false, null);
        }

        return this.objResponse(true, result);
    }

    async replaceOne(query: object, replacement: object, collection: ECollection): Promise<MongoResponse> {
        const result = await this.getCollection(collection).replaceOne(query, replacement);
        if(!result.acknowledged) {
            return this.objResponse(false, null);
        }

        return this.objResponse(true, result);
    }

    async handleTTLIndex(): Promise<void> {
        const collection = await this.getCollection(ECollection.tokens);

        const indexes: IndexDescription[] = await collection.indexes();
        const indexExists = indexes.some((index: IndexDescription) => index.name === "expiresAt_1");

        if(!indexExists) {
            await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
            console.log("TTL Index created");
        }
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