const { SearchClient, SearchIndexClient, AzureKeyCredential } = require("@azure/search-documents");
const { CosmosClient } = require("@azure/cosmos");
const { TextAnalyticsClient } = require("@azure/ai-text-analytics");
const { OpenAIClient } = require("@azure/openai");

// Load environment variables and initialize clients
const searchEndpoint = process.env.AZURE_SEARCH_ENDPOINT;
const searchApiKey = process.env.AZURE_SEARCH_KEY;
const searchIndexName = process.env.AZURE_SEARCH_INDEX_NAME || "content-index";

let searchClient = null;
let searchIndexClient = null;
let openAIClient = null;
let textAnalyticsClient = null;
let cosmosClient = null;

// Initialize all clients
function initClients() {
  if (!searchClient) {
    // Azure Cognitive Search clients
    const searchCredential = new AzureKeyCredential(searchApiKey);
    searchClient = new SearchClient(searchEndpoint, searchIndexName, searchCredential);
    searchIndexClient = new SearchIndexClient(searchEndpoint, searchCredential);

    // Azure OpenAI client for embeddings
    openAIClient = new OpenAIClient(
      process.env.AZURE_AI_FOUNDRY_ENDPOINT,
      new AzureKeyCredential(process.env.AZURE_AI_FOUNDRY_KEY)
    );

    // Text Analytics client for content preprocessing
    textAnalyticsClient = new TextAnalyticsClient(
      process.env.AZURE_COG_SERVICES_ENDPOINT,
      new AzureKeyCredential(process.env.AZURE_COG_SERVICES_KEY)
    );

    // Cosmos DB client for backup/additional storage
    cosmosClient = new CosmosClient({
      endpoint: process.env.COSMOS_DB_ENDPOINT,
      key: process.env.COSMOS_DB_KEY
    });
  }
}

module.exports = async function (context, req) {
  context.log('Vector Store function triggered');

  try {
    // Initialize all clients
    initClients();

    // Get the action from the route parameter
    const action = req.params.action || '';

    // Dispatch to the appropriate handler based on action
    switch (action.toLowerCase()) {
      case 'index':
        await handleIndexAction(context, req);
        break;
      case 'search':
        await handleSearchAction(context, req);
        break;
      case 'createindex':
        await handleCreateIndexAction(context, req);
        break;
      case 'delete':
        await handleDeleteAction(context, req);
        break;
      default:
        context.res = {
          status: 400,
          body: `Invalid action requested. Supported actions: index, search, createindex, delete`
        };
    }
  } catch (error) {
    context.log.error(`Error in Vector Store function: ${error}`);
    context.res = {
      status: 500,
      body: `An error occurred: ${error.message}`
    };
  }
};

/**
 * Create or update the search index schema
 */
async function handleCreateIndexAction(context, req) {
  try {
    // Define the search index with vector capabilities
    const indexDefinition = {
      name: searchIndexName,
      fields: [
        {
          name: "id",
          type: "Edm.String",
          key: true,
          searchable: false
        },
        {
          name: "contentId",
          type: "Edm.String",
          searchable: true,
          filterable: true
        },
        {
          name: "text",
          type: "Edm.String",
          searchable: true,
          analyzer: "en.microsoft"
        },
        {
          name: "title",
          type: "Edm.String",
          searchable: true,
          analyzer: "en.microsoft"
        },
        {
          name: "contentType",
          type: "Edm.String",
          filterable: true,
          facetable: true
        },
        {
          name: "source",
          type: "Edm.String",
          filterable: true,
          facetable: true
        },
        {
          name: "created",
          type: "Edm.DateTimeOffset",
          filterable: true,
          sortable: true
        },
        {
          name: "embedding",
          type: "Collection(Edm.Single)",
          dimensions: 1536, // Dimension for Azure OpenAI embeddings
          vectorSearchConfiguration: "vectorConfig"
        },
        {
          name: "keyPhrases",
          type: "Collection(Edm.String)",
          searchable: true,
          filterable: true,
          facetable: true
        },
        {
          name: "entities",
          type: "Collection(Edm.ComplexType)",
          fields: [
            {
              name: "name",
              type: "Edm.String",
              searchable: true,
              filterable: true
            },
            {
              name: "type",
              type: "Edm.String",
              filterable: true
            },
            {
              name: "confidence",
              type: "Edm.Double",
              filterable: true
            }
          ]
        }
      ],
      vectorSearch: {
        algorithmConfigurations: [
          {
            name: "vectorConfig",
            kind: "hnsw", // Hierarchical Navigable Small World algorithm
            parameters: {
              m: 16, // Max number of connections per node
              efConstruction: 400, // Size of the dynamic candidate list for constructing the graph
              efSearch: 500, // Size of the dynamic candidate list for searching the graph
              metric: "cosine" // Distance metric (cosine is common for text embeddings)
            }
          }
        ]
      },
      semantic: {
        configurations: [
          {
            name: "semanticConfig",
            prioritizedFields: {
              titleField: {
                fieldName: "title"
              },
              contentFields: [
                {
                  fieldName: "text"
                }
              ],
              keywordsFields: [
                {
                  fieldName: "keyPhrases"
                }
              ]
            }
          }
        ]
      }
    };

    // Create the index
    await searchIndexClient.createIndex(indexDefinition);

    context.res = {
      status: 200,
      body: `Successfully created search index '${searchIndexName}'`
    };
  } catch (error) {
    context.log.error(`Error creating index: ${error.message}`);
    context.res = {
      status: 500,
      body: `Error creating index: ${error.message}`
    };
  }
}

/**
 * Index content - generate embeddings and add to vector store
 */
async function handleIndexAction(context, req) {
  if (!req.body || !Array.isArray(req.body.documents)) {
    context.res = {
      status: 400,
      body: "Please provide documents array in the request body"
    };
    return;
  }

  try {
    const { documents } = req.body;
    const processedDocuments = [];

    // Process documents in batches of 10
    for (let i = 0; i < documents.length; i += 10) {
      const batch = documents.slice(i, i + 10);
      
      // Extract text for embedding generation
      const textsForEmbedding = batch.map(doc => doc.text || doc.title || "");
      
      // Generate embeddings using Azure OpenAI
      const embeddingResults = await openAIClient.getEmbeddings(
        process.env.AZURE_AI_FOUNDRY_DEPLOYMENT_NAME || "text-embedding-ada-002",
        textsForEmbedding
      );

      // Extract key phrases and entities
      const analyzeResults = await textAnalyticsClient.extractKeyPhrases(
        textsForEmbedding.map(text => text.substring(0, 5000)) // Limit to 5000 chars (API restriction)
      );
      
      const entityResults = await textAnalyticsClient.recognizeEntities(
        textsForEmbedding.map(text => text.substring(0, 5000))
      );

      // Combine all data
      for (let j = 0; j < batch.length; j++) {
        const doc = batch[j];
        const embedding = embeddingResults.data[j].embedding;
        const keyPhrases = analyzeResults[j].keyPhrases || [];
        const entities = entityResults[j].entities.map(e => ({
          name: e.text,
          type: e.category,
          confidence: e.confidenceScore
        })) || [];

        // Create final document for indexing
        processedDocuments.push({
          id: doc.id || `doc-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
          contentId: doc.contentId || doc.id,
          text: doc.text || "",
          title: doc.title || "",
          contentType: doc.contentType || "unknown",
          source: doc.source || "custom",
          created: doc.created || new Date().toISOString(),
          embedding: embedding,
          keyPhrases: keyPhrases,
          entities: entities
        });
      }
    }

    // Index the documents
    if (processedDocuments.length > 0) {
      await searchClient.uploadDocuments(processedDocuments);
    }

    context.res = {
      status: 200,
      body: {
        message: `Successfully indexed ${processedDocuments.length} documents`,
        indexedIds: processedDocuments.map(doc => doc.id)
      }
    };
  } catch (error) {
    context.log.error(`Error indexing documents: ${error.message}`);
    context.res = {
      status: 500,
      body: `Error indexing documents: ${error.message}`
    };
  }
}

/**
 * Search the vector store using vector or hybrid search
 */
async function handleSearchAction(context, req) {
  if (!req.body || (!req.body.query && !req.body.vectorQuery)) {
    context.res = {
      status: 400,
      body: "Please provide query or vectorQuery in the request body"
    };
    return;
  }

  try {
    const { 
      query, 
      filters, 
      vectorQuery, 
      top = 10,
      skip = 0,
      includeTotalCount = true,
      searchMode = "hybrid" // vector, semantic, hybrid
    } = req.body;
    
    let searchResults;
    
    if (searchMode === 'vector' || searchMode === 'hybrid') {
      // Generate vector embedding for the query
      let queryEmbedding;
      
      if (!vectorQuery) {
        // Generate embedding for the text query
        const embeddingResults = await openAIClient.getEmbeddings(
          process.env.AZURE_AI_FOUNDRY_DEPLOYMENT_NAME || "text-embedding-ada-002",
          [query]
        );
        queryEmbedding = embeddingResults.data[0].embedding;
      } else {
        // Use provided vector
        queryEmbedding = vectorQuery;
      }

      // Build the search options
      const searchOptions = {
        filter: filters,
        top: top,
        skip: skip,
        includeTotalCount: includeTotalCount,
        vectorQueries: [
          {
            vector: queryEmbedding,
            fields: ["embedding"],
            k: top,
            exhaustive: true
          }
        ]
      };

      // Add text search for hybrid mode
      if (searchMode === 'hybrid' && query) {
        searchOptions.search = query;
        searchOptions.searchFields = ['text', 'title', 'keyPhrases'];
        searchOptions.queryType = 'full';
      }

      // Execute the search
      searchResults = await searchClient.search("*", searchOptions);
    } else if (searchMode === 'semantic' && query) {
      // Semantic search
      searchResults = await searchClient.search(query, {
        filter: filters,
        top: top,
        skip: skip,
        includeTotalCount: includeTotalCount,
        searchFields: ['text', 'title', 'keyPhrases'],
        queryType: 'semantic',
        semanticConfiguration: 'semanticConfig'
      });
    } else {
      // Regular full-text search
      searchResults = await searchClient.search(query, {
        filter: filters,
        top: top,
        skip: skip,
        includeTotalCount: includeTotalCount,
        searchFields: ['text', 'title', 'keyPhrases']
      });
    }
    
    // Format the results
    const results = [];
    for await (const result of searchResults.results) {
      results.push({
        id: result.id,
        document: result.document,
        score: result.score,
        rerankerScore: result.rerankerScore
      });
    }

    context.res = {
      status: 200,
      body: {
        count: results.length,
        totalCount: searchResults.count,
        results: results
      }
    };
  } catch (error) {
    context.log.error(`Error searching documents: ${error.message}`);
    context.res = {
      status: 500,
      body: `Error searching documents: ${error.message}`
    };
  }
}

/**
 * Delete documents from the index
 */
async function handleDeleteAction(context, req) {
  if (!req.body || (!req.body.ids && !req.body.filter)) {
    context.res = {
      status: 400,
      body: "Please provide document ids or a filter in the request body"
    };
    return;
  }

  try {
    let deletedCount = 0;
    
    if (req.body.ids && Array.isArray(req.body.ids)) {
      // Delete specific documents by ID
      const idsToDelete = req.body.ids.map(id => ({ id }));
      await searchClient.deleteDocuments(idsToDelete);
      deletedCount = idsToDelete.length;
    } else if (req.body.filter) {
      // Delete documents using a filter
      // First, search for matching documents
      const searchOptions = {
        filter: req.body.filter,
        top: 1000, // Get a batch of matching documents
        select: ['id'] // Only retrieve the document IDs
      };
      
      const searchResults = await searchClient.search("*", searchOptions);
      const docsToDelete = [];
      
      // Collect all matching document IDs
      for await (const result of searchResults.results) {
        docsToDelete.push({ id: result.document.id });
      }
      
      // Delete the matching documents
      if (docsToDelete.length > 0) {
        await searchClient.deleteDocuments(docsToDelete);
        deletedCount = docsToDelete.length;
      }
    }

    context.res = {
      status: 200,
      body: {
        message: `Successfully deleted ${deletedCount} documents`,
      }
    };
  } catch (error) {
    context.log.error(`Error deleting documents: ${error.message}`);
    context.res = {
      status: 500,
      body: `Error deleting documents: ${error.message}`
    };
  }
}
