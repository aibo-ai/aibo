"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CosmosDBService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const cosmos_1 = require("@azure/cosmos");
let CosmosDBService = class CosmosDBService {
    constructor(configService) {
        this.configService = configService;
        const endpoint = this.configService.get('AZURE_COSMOS_ENDPOINT');
        const key = this.configService.get('AZURE_COSMOS_KEY');
        const databaseId = this.configService.get('AZURE_COSMOS_DATABASE');
        const containerId = this.configService.get('AZURE_COSMOS_CONTAINER');
        this.client = new cosmos_1.CosmosClient({ endpoint, key });
        this.database = this.client.database(databaseId);
        this.container = this.database.container(containerId);
    }
    async onModuleInit() {
        console.log('Initializing Cosmos DB service...');
        try {
            const { resource } = await this.client.database(this.configService.get('AZURE_COSMOS_DATABASE')).read();
            console.log(`Successfully connected to Cosmos DB: ${resource.id}`);
        }
        catch (error) {
            console.error('Failed to connect to Cosmos DB:', error.message);
        }
    }
    async createItem(item, partitionKey) {
        try {
            return await this.container.items.create(item);
        }
        catch (error) {
            console.error('Error creating item in Cosmos DB:', error.message);
            throw new Error(`Failed to create item: ${error.message}`);
        }
    }
    async readItem(id, partitionKey) {
        try {
            const { resource } = await this.container.item(id, partitionKey).read();
            return resource;
        }
        catch (error) {
            console.error('Error reading item from Cosmos DB:', error.message);
            throw new Error(`Failed to read item: ${error.message}`);
        }
    }
    async updateItem(id, item, partitionKey) {
        try {
            return await this.container.item(id, partitionKey).replace(item);
        }
        catch (error) {
            console.error('Error updating item in Cosmos DB:', error.message);
            throw new Error(`Failed to update item: ${error.message}`);
        }
    }
    async deleteItem(id, partitionKey) {
        try {
            return await this.container.item(id, partitionKey).delete();
        }
        catch (error) {
            console.error('Error deleting item from Cosmos DB:', error.message);
            throw new Error(`Failed to delete item: ${error.message}`);
        }
    }
    async queryItems(querySpec) {
        try {
            const { resources } = await this.container.items.query(querySpec).fetchAll();
            return resources;
        }
        catch (error) {
            console.error('Error querying items from Cosmos DB:', error.message);
            throw new Error(`Failed to query items: ${error.message}`);
        }
    }
    async createContainerIfNotExists(containerId, partitionKey) {
        try {
            const { container } = await this.database.containers.createIfNotExists({
                id: containerId,
                partitionKey: {
                    paths: ['/' + partitionKey],
                }
            });
            console.log(`Container created or already exists: ${containerId}`);
            return container;
        }
        catch (error) {
            console.error(`Error creating container ${containerId}:`, error.message);
            throw new Error(`Failed to create container: ${error.message}`);
        }
    }
    getContainer(containerId) {
        return this.database.container(containerId);
    }
    async storeVectorEmbeddings(contentId, content, embeddings, metadata = {}) {
        const item = {
            id: contentId,
            content,
            embeddings,
            metadata,
            type: 'embedding',
            createdAt: new Date().toISOString(),
        };
        try {
            return await this.container.items.create(item);
        }
        catch (error) {
            console.error('Error storing vector embeddings:', error.message);
            throw new Error(`Failed to store embeddings: ${error.message}`);
        }
    }
    async vectorSearch(embeddings, limit = 5) {
        const query = {
            query: "SELECT * FROM c WHERE c.type = 'embedding' ORDER BY VECTOR_DISTANCE(c.embeddings, @embeddings) LIMIT @limit",
            parameters: [
                { name: "@embeddings", value: embeddings },
                { name: "@limit", value: limit }
            ]
        };
        try {
            const { resources } = await this.container.items.query(query).fetchAll();
            return resources;
        }
        catch (error) {
            console.error('Error performing vector search:', error.message);
            throw new Error(`Failed to perform vector search: ${error.message}`);
        }
    }
};
exports.CosmosDBService = CosmosDBService;
exports.CosmosDBService = CosmosDBService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], CosmosDBService);
//# sourceMappingURL=cosmos-db.service.js.map