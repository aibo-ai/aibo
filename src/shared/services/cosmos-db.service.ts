import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CosmosClient, Database, Container, ItemResponse } from '@azure/cosmos';

@Injectable()
export class CosmosDBService implements OnModuleInit {
  private client: CosmosClient;
  private database: Database;
  private container: Container;

  constructor(private configService: ConfigService) {
    const endpoint = this.configService.get<string>('AZURE_COSMOS_ENDPOINT');
    const key = this.configService.get<string>('AZURE_COSMOS_KEY');
    const databaseId = this.configService.get<string>('AZURE_COSMOS_DATABASE');
    const containerId = this.configService.get<string>('AZURE_COSMOS_CONTAINER');

    this.client = new CosmosClient({ endpoint, key });
    this.database = this.client.database(databaseId);
    this.container = this.database.container(containerId);
  }

  async onModuleInit() {
    console.log('Initializing Cosmos DB service...');
    
    // Validate connection
    try {
      const { resource } = await this.client.database(
        this.configService.get<string>('AZURE_COSMOS_DATABASE')
      ).read();
      
      console.log(`Successfully connected to Cosmos DB: ${resource.id}`);
    } catch (error) {
      console.error('Failed to connect to Cosmos DB:', error.message);
    }
  }

  /**
   * Create a new item in the container
   * @param item The item to create
   * @param partitionKey Optional custom partition key
   */
  async createItem<T>(item: T, partitionKey?: string): Promise<ItemResponse<T>> {
    try {
      return await this.container.items.create<T>(item);
    } catch (error) {
      console.error('Error creating item in Cosmos DB:', error.message);
      throw new Error(`Failed to create item: ${error.message}`);
    }
  }

  /**
   * Read an item from the container
   * @param id The id of the item
   * @param partitionKey The partition key of the item
   */
  async readItem<T>(id: string, partitionKey: string): Promise<T> {
    try {
      const { resource } = await this.container.item(id, partitionKey).read<T>();
      return resource;
    } catch (error) {
      console.error('Error reading item from Cosmos DB:', error.message);
      throw new Error(`Failed to read item: ${error.message}`);
    }
  }

  /**
   * Update an existing item in the container
   * @param id The id of the item to update
   * @param item The updated item
   * @param partitionKey The partition key of the item
   */
  async updateItem<T>(id: string, item: T, partitionKey: string): Promise<ItemResponse<T>> {
    try {
      return await this.container.item(id, partitionKey).replace<T>(item);
    } catch (error) {
      console.error('Error updating item in Cosmos DB:', error.message);
      throw new Error(`Failed to update item: ${error.message}`);
    }
  }

  /**
   * Delete an item from the container
   * @param id The id of the item to delete
   * @param partitionKey The partition key of the item
   */
  async deleteItem(id: string, partitionKey: string): Promise<ItemResponse<any>> {
    try {
      return await this.container.item(id, partitionKey).delete();
    } catch (error) {
      console.error('Error deleting item from Cosmos DB:', error.message);
      throw new Error(`Failed to delete item: ${error.message}`);
    }
  }

  /**
   * Query items in the container
   * @param querySpec The SQL query specification
   */
  async queryItems<T>(querySpec: string): Promise<T[]> {
    try {
      const { resources } = await this.container.items.query<T>(querySpec).fetchAll();
      return resources;
    } catch (error) {
      console.error('Error querying items from Cosmos DB:', error.message);
      throw new Error(`Failed to query items: ${error.message}`);
    }
  }

  /**
   * Create a container if it doesn't exist
   * @param containerId The id of the container
   * @param partitionKey The partition key for the container
   */
  async createContainerIfNotExists(containerId: string, partitionKey: string): Promise<Container> {
    try {
      const { container } = await this.database.containers.createIfNotExists({
        id: containerId,
        partitionKey: {
          paths: ['/' + partitionKey],
        }
      });
      console.log(`Container created or already exists: ${containerId}`);
      return container;
    } catch (error) {
      console.error(`Error creating container ${containerId}:`, error.message);
      throw new Error(`Failed to create container: ${error.message}`);
    }
  }

  /**
   * Get a reference to a specific container
   * @param containerId The id of the container
   */
  getContainer(containerId: string): Container {
    return this.database.container(containerId);
  }

  /**
   * Store vector embeddings for content
   * @param contentId The id of the content
   * @param content The content text
   * @param embeddings The vector embeddings
   * @param metadata Additional metadata
   */
  async storeVectorEmbeddings(
    contentId: string,
    content: string,
    embeddings: number[],
    metadata: any = {}
  ): Promise<ItemResponse<any>> {
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
    } catch (error) {
      console.error('Error storing vector embeddings:', error.message);
      throw new Error(`Failed to store embeddings: ${error.message}`);
    }
  }

  /**
   * Perform vector search using embeddings
   * @param embeddings The query embeddings
   * @param limit Maximum number of results
   */
  async vectorSearch(embeddings: number[], limit: number = 5): Promise<any[]> {
    // This requires Cosmos DB with vector search capability
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
    } catch (error) {
      console.error('Error performing vector search:', error.message);
      throw new Error(`Failed to perform vector search: ${error.message}`);
    }
  }
}
