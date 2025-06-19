import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Container, ItemResponse } from '@azure/cosmos';
export declare class CosmosDBService implements OnModuleInit {
    private configService;
    private client;
    private database;
    private container;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    createItem<T>(item: T, partitionKey?: string): Promise<ItemResponse<T>>;
    readItem<T>(id: string, partitionKey: string): Promise<T>;
    updateItem<T>(id: string, item: T, partitionKey: string): Promise<ItemResponse<T>>;
    deleteItem(id: string, partitionKey: string): Promise<ItemResponse<any>>;
    queryItems<T>(querySpec: string): Promise<T[]>;
    createContainerIfNotExists(containerId: string, partitionKey: string): Promise<Container>;
    getContainer(containerId: string): Container;
    storeVectorEmbeddings(contentId: string, content: string, embeddings: number[], metadata?: any): Promise<ItemResponse<any>>;
    vectorSearch(embeddings: number[], limit?: number): Promise<any[]>;
}
