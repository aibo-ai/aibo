# Freshness Aggregator Azure Function

A serverless Azure Function that implements a Query-Document-Feature (QDF) ranking algorithm for content freshness aggregation. This function integrates with Cosmos DB for caching, Azure Key Vault for secrets management, and Application Insights for monitoring.

## Features

- **QDF Algorithm**: Ranks content based on freshness, popularity, and relevance
- **Intelligent Caching**: Uses Cosmos DB with TTL for performance optimization
- **Secure Configuration**: Secrets managed through Azure Key Vault
- **Comprehensive Monitoring**: Application Insights integration for telemetry
- **TypeScript**: Fully typed implementation with comprehensive error handling
- **Scalable Architecture**: Serverless design with configurable options

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   HTTP Request  │───▶│ Azure Function  │───▶│   QDF Service   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │  Key Vault      │    │  Cache Service  │
                       │  (Secrets)      │    │  (Cosmos DB)    │
                       └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │ App Insights    │    │   Document      │
                       │ (Monitoring)    │    │   Retrieval     │
                       └─────────────────┘    └─────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+
- Azure CLI
- Azure Functions Core Tools
- Azure subscription

### 1. Setup Azure Resources

Run the automated setup script to create all required Azure resources:

```bash
chmod +x azure-setup.sh
./azure-setup.sh
```

This creates:
- Resource Group
- Function App
- Cosmos DB (database + container)
- Key Vault
- Application Insights
- Storage Account

### 2. Install Dependencies

```bash
npm install
```

### 3. Build and Deploy

```bash
# Build the TypeScript project
npm run build

# Deploy to Azure
./deploy.sh
```

### 4. Test the Function

```bash
# Run comprehensive tests
./test-function.sh

# Or test manually
curl -X POST https://your-function-app.azurewebsites.net/api/freshness-aggregator \
  -H "Content-Type: application/json" \
  -d '{"query": "azure functions", "options": {"maxResults": 5}}'
```

## API Reference

### Endpoint

```
POST /api/freshness-aggregator
```

### Request Body

```json
{
  "query": "search query string",
  "options": {
    "maxResults": 10,
    "freshnessWeight": 0.4,
    "popularityWeight": 0.3,
    "contentTypes": ["article", "blog", "documentation"],
    "minFreshnessScore": 0.1
  }
}
```

### Response

```json
{
  "query": "search query string",
  "results": [
    {
      "document": {
        "id": "doc1",
        "title": "Document Title",
        "content": "Document content...",
        "publishedAt": "2024-01-15T00:00:00.000Z",
        "lastModified": "2024-01-16T00:00:00.000Z",
        "contentType": "article",
        "popularity": 85,
        "tags": ["tag1", "tag2"],
        "url": "https://example.com/doc1"
      },
      "score": 0.85,
      "freshnessScore": 0.9,
      "popularityScore": 0.85,
      "relevanceScore": 0.8
    }
  ],
  "metadata": {
    "processedAt": "2024-01-20T10:30:00.000Z",
    "durationMs": 150
  }
}
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `KEY_VAULT_URL` | Azure Key Vault URL | Required |
| `COSMOS_DB_ID` | Cosmos DB database name | `freshness-aggregator` |
| `COSMOS_CONTAINER_ID` | Cosmos DB container name | `cache` |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | App Insights connection string | Required |
| `CACHE_TTL_SECONDS` | Cache TTL in seconds | `3600` |
| `NODE_ENV` | Environment mode | `production` |

### QDF Algorithm Parameters

- **freshnessWeight** (0-1): Weight for content freshness (default: 0.4)
- **popularityWeight** (0-1): Weight for content popularity (default: 0.3)
- **relevanceWeight**: Automatically calculated as `1 - freshnessWeight - popularityWeight`
- **maxResults**: Maximum number of results to return (default: 10)
- **minFreshnessScore**: Minimum freshness score threshold (default: 0.1)
- **contentTypes**: Array of allowed content types (default: ["article", "blog", "news", "documentation"])

## Development

### Local Development

```bash
# Install dependencies
npm install

# Start local development server
npm start

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Watch mode for development
npm run watch
```

### Testing

```bash
# Run all tests
npm test

# Run unit tests only
npm test -- --testPathPattern=unit

# Run integration tests only
npm test -- --testPathPattern=integration

# Run tests with coverage
npm run test:coverage
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Build TypeScript
npm run build

# Clean build artifacts
npm run clean
```

## Monitoring and Observability

### Application Insights Metrics

The function automatically tracks:
- Request duration and success rates
- Cache hit/miss ratios
- QDF scoring performance
- Error rates and exceptions
- Custom business metrics

### Key Metrics to Monitor

- **QueryDuration**: Time taken to process queries
- **CacheHitRate**: Percentage of cache hits vs misses
- **QdfScoreDistribution**: Distribution of QDF scores
- **ErrorRate**: Rate of failed requests
- **ThroughputRPS**: Requests per second

### Logging

Structured logging with correlation IDs:
```typescript
context.log('Query processed', {
  operationId: context.invocationId,
  query: 'user query',
  resultCount: 5,
  durationMs: 150
});
```

## Deployment

### Automated Deployment

```bash
# Deploy using the provided script
./deploy.sh
```

### Manual Deployment

```bash
# Build the project
npm run build

# Deploy to Azure
func azure functionapp publish your-function-app-name --typescript
```

### CI/CD Pipeline

Example Azure DevOps pipeline:

```yaml
trigger:
  branches:
    include:
    - main
  paths:
    include:
    - src/components/bottom-layer/freshness-aggregator/functions/*

pool:
  vmImage: 'ubuntu-latest'

variables:
  functionAppName: 'freshness-aggregator-func'
  resourceGroupName: 'freshness-aggregator-rg'

steps:
- task: NodeTool@0
  inputs:
    versionSpec: '18.x'
  displayName: 'Install Node.js'

- script: |
    npm install
    npm run build
    npm test
  displayName: 'Build and Test'

- task: AzureFunctionApp@1
  inputs:
    azureSubscription: 'Azure Service Connection'
    appType: 'functionAppLinux'
    appName: $(functionAppName)
    resourceGroupName: $(resourceGroupName)
    package: '$(System.DefaultWorkingDirectory)'
  displayName: 'Deploy Azure Function'
```

## Performance Optimization

### Caching Strategy

- **Query Results**: Cached in Cosmos DB with configurable TTL
- **Document Metadata**: Cached to reduce retrieval overhead
- **Scoring Calculations**: Cached for repeated queries

### Scaling Considerations

- **Consumption Plan**: Automatically scales based on demand
- **Premium Plan**: For consistent performance and VNet integration
- **Cosmos DB**: Configure appropriate RU/s based on usage patterns

### Best Practices

1. **Cache Warming**: Pre-populate cache for common queries
2. **Batch Processing**: Process multiple queries in batches when possible
3. **Connection Pooling**: Reuse Cosmos DB connections
4. **Async Operations**: Use async/await for all I/O operations

## Security

### Authentication & Authorization

- **Managed Identity**: Function uses system-assigned managed identity
- **Key Vault Access**: Secured with RBAC policies
- **Cosmos DB Access**: Role-based access control

### Data Protection

- **Encryption**: All data encrypted at rest and in transit
- **Secrets Management**: No hardcoded secrets, all in Key Vault
- **Network Security**: VNet integration available in Premium plans

## Troubleshooting

### Common Issues

1. **Function Timeout**: Increase timeout or optimize query performance
2. **Cosmos DB Throttling**: Increase RU/s or implement retry logic
3. **Key Vault Access**: Verify managed identity permissions
4. **Memory Issues**: Optimize data structures and caching

### Debug Commands

```bash
# View function logs
az functionapp log tail --name your-function-app --resource-group your-rg

# Monitor Application Insights
az monitor app-insights metrics show --app your-app-insights --metric requests/count

# Check Cosmos DB metrics
az cosmosdb show --name your-cosmos-account --resource-group your-rg
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Create an issue in the repository
- Check Application Insights for runtime errors
- Review Azure Function logs for debugging information
