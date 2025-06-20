// Jest setup file for Azure Functions tests

// Test utilities as module exports instead of globals

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.KEY_VAULT_URL = 'https://test-keyvault.vault.azure.net/';
process.env.COSMOS_DB_ID = 'test-database';
process.env.COSMOS_CONTAINER_ID = 'test-container';
process.env.CACHE_TTL_SECONDS = '3600';
process.env.APPLICATIONINSIGHTS_CONNECTION_STRING = 'InstrumentationKey=test-key';

// Mock Azure SDK modules
jest.mock('@azure/identity', () => ({
  DefaultAzureCredential: jest.fn().mockImplementation(() => ({
    getToken: jest.fn().mockResolvedValue({
      token: 'mock-token',
      expiresOnTimestamp: Date.now() + 3600000
    })
  }))
}));

jest.mock('@azure/keyvault-secrets', () => ({
  SecretClient: jest.fn().mockImplementation(() => ({
    getSecret: jest.fn().mockResolvedValue({
      value: 'AccountEndpoint=https://test-cosmos.documents.azure.com:443/;AccountKey=test-key;'
    })
  }))
}));

jest.mock('@azure/cosmos', () => ({
  CosmosClient: jest.fn().mockImplementation(() => ({
    database: jest.fn().mockReturnValue({
      container: jest.fn().mockReturnValue({
        items: {
          upsert: jest.fn().mockResolvedValue({ resource: {} }),
          query: jest.fn().mockReturnValue({
            fetchAll: jest.fn().mockResolvedValue({ resources: [] })
          })
        },
        item: jest.fn().mockReturnValue({
          read: jest.fn().mockResolvedValue({ resource: null }),
          delete: jest.fn().mockResolvedValue({})
        })
      })
    }),
    databases: {
      createIfNotExists: jest.fn().mockResolvedValue({})
    }
  }))
}));

jest.mock('applicationinsights', () => ({
  setup: jest.fn().mockReturnThis(),
  setAutoDependencyCorrelation: jest.fn().mockReturnThis(),
  setAutoCollectRequests: jest.fn().mockReturnThis(),
  setAutoCollectPerformance: jest.fn().mockReturnThis(),
  setAutoCollectExceptions: jest.fn().mockReturnThis(),
  setAutoCollectDependencies: jest.fn().mockReturnThis(),
  setAutoCollectConsole: jest.fn().mockReturnThis(),
  setUseDiskRetryCaching: jest.fn().mockReturnThis(),
  setSendLiveMetrics: jest.fn().mockReturnThis(),
  setDistributedTracingMode: jest.fn().mockReturnThis(),
  start: jest.fn(),
  defaultClient: {
    trackEvent: jest.fn(),
    trackMetric: jest.fn(),
    trackException: jest.fn(),
    trackDependency: jest.fn(),
    trackRequest: jest.fn(),
    flush: jest.fn(),
    commonProperties: {}
  },
  DistributedTracingModes: {
    AI_AND_W3C: 'AI_AND_W3C'
  },
  getCorrelationContext: jest.fn().mockReturnValue({
    operation: { id: 'test-operation-id' }
  })
}));

// Test utilities as exports
export const mockContext = {
  invocationId: 'test-invocation-id',
  log: jest.fn(),
  res: {},
  done: jest.fn()
};

export const mockRequest = {
  method: 'POST',
  url: 'https://test.azurewebsites.net/api/freshness-aggregator',
  headers: { 'content-type': 'application/json' },
  query: {},
  body: { query: 'test query' }
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
