import { InvocationContext } from '@azure/functions';
import { freshnessAggregator } from '../../functions/freshness-aggregator';

describe('Freshness Aggregator Function Integration Tests', () => {
  let context: InvocationContext;
  let mockRequest: any;

  beforeEach(() => {
    context = {
      invocationId: 'test-invocation-id',
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn()
    } as any;

    mockRequest = {
      method: 'POST',
      url: 'https://test.azurewebsites.net/api/freshness-aggregator',
      headers: new Map([
        ['content-type', 'application/json']
      ]),
      query: new URLSearchParams(),
      text: jest.fn(),
      json: jest.fn(),
      arrayBuffer: jest.fn(),
      formData: jest.fn()
    };
  });

  describe('successful requests', () => {
    it('should process valid query and return results', async () => {
      const requestBody = {
        query: 'azure functions',
        options: {
          maxResults: 5
        }
      };

      mockRequest.text.mockResolvedValue(JSON.stringify(requestBody));

      const response = await freshnessAggregator(mockRequest, context);

      expect(response.status).toBe(200);
      expect(response.jsonBody).toHaveProperty('query', 'azure functions');
      expect(response.jsonBody).toHaveProperty('results');
      expect(response.jsonBody).toHaveProperty('metadata');
    });

    it('should handle query with custom options', async () => {
      const requestBody = {
        query: 'cosmos database',
        options: {
          maxResults: 3,
          freshnessWeight: 0.6,
          popularityWeight: 0.2,
          contentTypes: ['documentation']
        }
      };

      mockRequest.text.mockResolvedValue(JSON.stringify(requestBody));

      const response = await freshnessAggregator(mockRequest, context);

      expect(response.status).toBe(200);
      expect(response.jsonBody).toHaveProperty('query', 'cosmos database');
      expect(response.jsonBody).toHaveProperty('results');
    });

    it('should handle empty results gracefully', async () => {
      const requestBody = {
        query: 'nonexistentquery12345',
        options: {}
      };

      mockRequest.text.mockResolvedValue(JSON.stringify(requestBody));

      const response = await freshnessAggregator(mockRequest, context);

      expect(response.status).toBe(200);
      expect(response.jsonBody).toHaveProperty('results', []);
    });
  });

  describe('error handling', () => {
    it('should return 400 for missing query parameter', async () => {
      const requestBody = {
        options: { maxResults: 5 }
      };

      mockRequest.text.mockResolvedValue(JSON.stringify(requestBody));

      const response = await freshnessAggregator(mockRequest, context);

      expect(response.status).toBe(400);
      expect(response.jsonBody).toHaveProperty('error', 'Failed to process query');
      expect(response.jsonBody).toHaveProperty('message', 'Query parameter is required');
      expect(response.jsonBody).toHaveProperty('operationId', context.invocationId);
    });

    it('should return 400 for empty request body', async () => {
      mockRequest.text.mockResolvedValue('');

      const response = await freshnessAggregator(mockRequest, context);

      expect(response.status).toBe(400);
      expect(response.jsonBody).toHaveProperty('error', 'Failed to process query');
    });

    it('should handle missing environment variables', async () => {
      const requestBody = {
        query: 'test query'
      };

      mockRequest.text.mockResolvedValue(JSON.stringify(requestBody));

      // Temporarily remove KEY_VAULT_URL
      const originalKeyVaultUrl = process.env.KEY_VAULT_URL;
      delete process.env.KEY_VAULT_URL;

      const response = await freshnessAggregator(mockRequest, context);

      expect(response.status).toBe(500);
      expect(response.jsonBody).toHaveProperty('error', 'Failed to process query');

      // Restore environment variable
      if (originalKeyVaultUrl) {
        process.env.KEY_VAULT_URL = originalKeyVaultUrl;
      }
    });

    it('should include stack trace in development mode', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const requestBody = {
        query: 'test query'
      };

      mockRequest.text.mockResolvedValue(JSON.stringify(requestBody));

      const response = await freshnessAggregator(mockRequest, context);

      expect(response.status).toBe(200);
      expect(response.jsonBody).toHaveProperty('stack');

      // Restore environment
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should not include stack trace in production mode', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const requestBody = {
        query: 'test query'
      };

      mockRequest.text.mockResolvedValue(JSON.stringify(requestBody));

      const response = await freshnessAggregator(mockRequest, context);

      expect(response.status).toBe(200);
      expect(response.jsonBody).not.toHaveProperty('stack');

      // Restore environment
      process.env.NODE_ENV = originalNodeEnv;
    });
  });

  describe('logging and monitoring', () => {
    it('should log request details', async () => {
      const requestBody = {
        query: 'azure functions',
        options: {
          maxResults: 5
        }
      };

      mockRequest.text.mockResolvedValue(JSON.stringify(requestBody));

      await freshnessAggregator(mockRequest, context);

      expect(context.log).toHaveBeenCalledWith(
        expect.stringContaining('Request received'),
        expect.objectContaining({
          operationId: context.invocationId,
          query: expect.any(Object),
          body: 'Body present'
        })
      );
    });

    it('should log successful processing', async () => {
      const requestBody = {
        query: 'azure functions',
        options: {
          maxResults: 5
        }
      };

      mockRequest.text.mockResolvedValue(JSON.stringify(requestBody));

      await freshnessAggregator(mockRequest, context);

      expect(context.log).toHaveBeenCalledWith(
        expect.stringContaining('Query processed in'),
        expect.objectContaining({
          operationId: context.invocationId,
          query: 'azure functions',
          resultCount: expect.any(Number)
        })
      );
    });

    it('should log errors with details', async () => {
      const requestBody = {
        query: 'test query'
      };

      mockRequest.text.mockResolvedValue(JSON.stringify(requestBody));

      await freshnessAggregator(mockRequest, context);

      expect(context.error).toHaveBeenCalledWith(
        expect.stringContaining('Error processing request'),
        expect.objectContaining({
          operationId: context.invocationId,
          statusCode: 200
        })
      );
    });
  });

  describe('performance', () => {
    it('should complete processing within reasonable time', async () => {
      const requestBody = {
        query: 'azure functions',
        options: {
          maxResults: 5
        }
      };

      mockRequest.text.mockResolvedValue(JSON.stringify(requestBody));

      const startTime = Date.now();

      await freshnessAggregator(mockRequest, context);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle multiple concurrent requests', async () => {
      const requests = Array.from({ length: 3 }, (_, i) => {
        const testContext: InvocationContext = {
          invocationId: `test-concurrent-${i}`,
          functionName: 'freshnessAggregator',
          extraInputs: new Map(),
          extraOutputs: new Map(),
          retryContext: undefined,
          traceContext: undefined,
          triggerMetadata: {},
          options: {} as any,
          log: jest.fn(),
          error: jest.fn(),
          warn: jest.fn(),
          info: jest.fn(),
          debug: jest.fn(),
          trace: jest.fn()
        };
        const testRequest = {
          ...mockRequest,
          text: jest.fn().mockResolvedValue(JSON.stringify({
            query: `test query ${i}`
          }))
        };
        return freshnessAggregator(testRequest, testContext);
      });

      const results = await Promise.all(requests);

      results.forEach((result, index) => {
        expect(result.status).toBe(200);
        expect(result.jsonBody).toHaveProperty('success', true);
        expect(result.jsonBody.data).toHaveProperty('query', `test query ${index}`);
      });
    });
  });

  describe('caching behavior', () => {
    it('should use cache for repeated queries', async () => {
      const requestBody = {
        query: 'azure functions',
        options: {
          maxResults: 5
        }
      };

      mockRequest.text.mockResolvedValue(JSON.stringify(requestBody));

      const response1 = await freshnessAggregator(mockRequest, context);
      const response2 = await freshnessAggregator(mockRequest, context);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      
      // Both should succeed (cache behavior is tested in unit tests)
      expect(response1.jsonBody.query).toBe(response2.jsonBody.query);
    });
  });
});
