// Script to populate Cosmos DB with initial data for Query Intent Analyzer

const { CosmosClient } = require('@azure/cosmos');
const { v4: uuidv4 } = require('uuid');

// Load environment variables from .env file
require('dotenv').config();

// Cosmos DB connection details
const endpoint = process.env.AZURE_COSMOS_ENDPOINT;
const key = process.env.AZURE_COSMOS_KEY;
const databaseId = process.env.AZURE_COSMOS_DATABASE;
const queryIntentsContainerId = 'queryIntents';
const contentStrategiesContainerId = 'contentStrategies';

// Initialize Cosmos client
const client = new CosmosClient({ endpoint, key });
const database = client.database(databaseId);
const queryIntentsContainer = database.container(queryIntentsContainerId);
const contentStrategiesContainer = database.container(contentStrategiesContainerId);

// Sample query intents data
const sampleQueryIntents = [
  {
    id: uuidv4(),
    topic: 'content marketing',
    primaryIntent: 'informational',
    secondaryIntents: ['commercial', 'navigational'],
    confidence: 0.85,
    suggestedApproach: 'Create comprehensive guide about content marketing focusing on informational aspects with practical examples.',
    keyThemes: ['content strategy', 'content creation', 'content distribution', 'content analytics', 'SEO'],
    keywordClusters: [
      'content marketing overview',
      'content marketing guide',
      'content marketing tutorial',
      'best content marketing practices',
      'content strategy',
      'content creation'
    ],
    conversationalQueries: [
      'How to create a content marketing strategy?',
      'What is content marketing?',
      'How to measure content marketing ROI?',
      'Best content marketing tools'
    ],
    queryTypeDistribution: {
      informational: 0.7,
      transactional: 0.1,
      navigational: 0.1,
      commercial: 0.1
    },
    searchParameters: {
      includeDomains: [],
      excludeDomains: ['pinterest.com', 'quora.com'],
      contentTypes: ['article', 'guide', 'blog'],
      timeframe: 'recent',
      filters: {
        recency: 'recent',
        contentTypes: ['article', 'guide', 'blog'],
        minLength: '1000'
      },
      semanticBoost: true
    },
    timestamp: new Date().toISOString(),
    queryExpansion: {
      expandedQueries: [
        'content marketing strategy',
        'content marketing examples',
        'content marketing best practices',
        'content marketing for beginners',
        'content marketing ROI'
      ],
      semanticQueries: [
        'how to create engaging content',
        'content strategy development',
        'content distribution channels',
        'content performance metrics',
        'content marketing tools'
      ],
      relatedConcepts: [
        'SEO',
        'inbound marketing',
        'content strategy',
        'digital marketing',
        'lead generation'
      ]
    },
    semanticSearchResults: [
      {
        title: 'Content Marketing Guide: Strategy, Examples, and Tools',
        url: 'https://example.com/content-marketing-guide',
        snippet: 'This comprehensive guide covers everything you need to know about content marketing. Learn the fundamentals, advanced techniques, and best practices.',
        score: 0.95
      },
      {
        title: 'How to Create a Content Marketing Strategy That Works',
        url: 'https://example.com/content-marketing-strategy',
        snippet: 'Step-by-step guide to creating an effective content marketing strategy. Follow along with practical examples and templates.',
        score: 0.85
      }
    ]
  },
  {
    id: uuidv4(),
    topic: 'technical SEO',
    segment: 'b2b',
    primaryIntent: 'informational',
    secondaryIntents: ['commercial'],
    confidence: 0.9,
    suggestedApproach: 'Create detailed technical guide about technical SEO focusing on enterprise implementation and best practices.',
    keyThemes: ['site architecture', 'crawlability', 'indexation', 'schema markup', 'page speed', 'mobile optimization'],
    keywordClusters: [
      'technical SEO overview',
      'technical SEO guide',
      'technical SEO audit',
      'enterprise technical SEO solutions',
      'technical SEO for business',
      'technical SEO implementation strategy'
    ],
    conversationalQueries: [
      'How to perform a technical SEO audit?',
      'What is technical SEO?',
      'How to fix indexation issues?',
      'Best technical SEO tools for enterprise'
    ],
    queryTypeDistribution: {
      informational: 0.8,
      transactional: 0.05,
      navigational: 0.05,
      commercial: 0.1
    },
    timestamp: new Date().toISOString()
  }
];

// Sample content strategies data
const sampleContentStrategies = [
  {
    id: uuidv4(),
    topic: 'content marketing',
    contentType: 'guide',
    segment: 'b2b',
    structure: [
      "Introduction and problem statement",
      "Key benefits and value proposition",
      "Content marketing framework overview",
      "Step-by-step implementation guide",
      "Measurement and analytics",
      "Case studies and examples",
      "Conclusion with call to action"
    ],
    tonalityGuide: "Professional, authoritative, evidence-based with industry terminology",
    contentElements: [
      "Data visualizations",
      "Expert quotes",
      "Real-world examples",
      "Action steps",
      "ROI calculations"
    ],
    citationStrategy: "Industry research with authoritative sources",
    suggestedLLMOptimizations: [
      "Clear section headers",
      "Bulleted lists for key points",
      "Summary paragraphs at section ends",
      "Table of contents with anchor links"
    ],
    timestamp: new Date().toISOString()
  },
  {
    id: uuidv4(),
    topic: 'technical SEO',
    contentType: 'whitepaper',
    segment: 'b2b',
    structure: [
      "Executive summary",
      "Technical SEO fundamentals",
      "Enterprise implementation challenges",
      "Advanced optimization techniques",
      "Integration with other marketing channels",
      "Measurement framework",
      "Future trends and recommendations"
    ],
    tonalityGuide: "Technical, precise, data-driven with expert terminology",
    contentElements: [
      "Technical diagrams",
      "Code examples",
      "Implementation checklists",
      "Case studies",
      "Performance metrics"
    ],
    citationStrategy: "Technical documentation and research papers",
    suggestedLLMOptimizations: [
      "Structured headings with clear hierarchy",
      "Code blocks with syntax highlighting",
      "Technical glossary",
      "Expandable sections for advanced topics"
    ],
    timestamp: new Date().toISOString()
  }
];

// Function to create items in Cosmos DB
async function createItems() {
  console.log('Creating sample query intents...');
  for (const intent of sampleQueryIntents) {
    try {
      const { resource: createdItem } = await queryIntentsContainer.items.create(intent);
      console.log(`Created query intent with id: ${createdItem.id}`);
    } catch (error) {
      console.error(`Error creating query intent: ${error.message}`);
    }
  }

  console.log('Creating sample content strategies...');
  for (const strategy of sampleContentStrategies) {
    try {
      const { resource: createdItem } = await contentStrategiesContainer.items.create(strategy);
      console.log(`Created content strategy with id: ${createdItem.id}`);
    } catch (error) {
      console.error(`Error creating content strategy: ${error.message}`);
    }
  }

  console.log('Finished creating sample data for Query Intent Analyzer');
}

// Execute the function
createItems()
  .catch(error => {
    console.error('Error in script execution:', error);
  });
