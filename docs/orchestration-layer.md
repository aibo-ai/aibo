# Orchestration Layer Documentation

## Overview

The Orchestration Layer serves as the central coordination hub that seamlessly connects the Bottom, Middle, and Top layers of the Content Architect system. It provides a unified API for content generation, manages complex multi-layer workflows, and handles asynchronous processing through Azure Service Bus integration.

## Architecture

### Core Components

1. **ContentArchitectController** - Main API entry point for content generation requests
2. **OrchestrationService** - Core service managing end-to-end workflows
3. **JobManagementService** - Handles job lifecycle, status tracking, and persistence
4. **WorkflowEngineService** - Manages workflow definitions and execution order
5. **RealtimeUpdatesService** - Provides real-time progress updates via WebSocket/SignalR
6. **Azure Function** - Processes jobs from Service Bus queue

### Layer Integration

```
┌─────────────────────────────────────────────────────────────┐
│                    Orchestration Layer                      │
├─────────────────────────────────────────────────────────────┤
│  ContentArchitectController → OrchestrationService         │
│           ↓                           ↓                     │
│  JobManagementService    WorkflowEngineService             │
│           ↓                           ↓                     │
│  RealtimeUpdatesService  Azure Service Bus                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Layer Execution                          │
├─────────────────────────────────────────────────────────────┤
│  Bottom Layer → Middle Layer → Top Layer                   │
│  (Analysis)     (Structure)    (Generation)                │
└─────────────────────────────────────────────────────────────┘
```

## API Reference

### Content Generation Endpoint

**POST** `/content-architect/generate`

Generate comprehensive content using all layers with configurable workflows.

#### Request Body

```typescript
{
  // Content specifications
  "topic": "Artificial Intelligence in Healthcare",
  "contentType": "blog_post" | "technical_guide" | "case_study" | "product_review" | "industry_analysis" | "social_media" | "whitepaper" | "email_campaign",
  "audience": "b2b" | "b2c",
  
  // Optional content parameters
  "targetLength": "short" | "medium" | "long",
  "toneOfVoice": "formal" | "conversational" | "technical" | "friendly" | "authoritative",
  "purpose": "Educate healthcare professionals about AI applications",
  "keyPoints": ["Current applications", "Benefits", "Challenges"],
  "searchKeywords": ["AI healthcare", "medical AI"],
  
  // Processing options
  "includeResearch": true,
  "includeCitations": true,
  "includeEEAT": true,
  "includeSchemaMarkup": true,
  "includeSEOOptimization": true,
  
  // Workflow configuration
  "workflowType": "standard" | "research_heavy" | "seo_focused" | "citation_heavy" | "custom",
  "priority": "low" | "normal" | "high" | "urgent",
  
  // Async processing
  "async": true,
  "callbackUrl": "https://your-app.com/webhook/content-ready",
  
  // Metadata
  "userId": "user-123",
  "projectId": "project-456",
  "tags": ["healthcare", "ai"]
}
```

#### Response

```typescript
{
  "jobId": "job-1640995200000-abc123",
  "status": "queued" | "processing" | "completed" | "failed",
  "message": "Content generation job queued successfully",
  "estimatedCompletionTime": "2024-01-01T12:05:00Z",
  "result": {
    // Available when status is "completed"
    "content": { /* Generated content */ },
    "metadata": { /* Processing metadata */ }
  },
  "progress": {
    "currentStep": "analyze_intent",
    "completedSteps": ["analyze_intent"],
    "totalSteps": 5,
    "percentage": 20
  },
  "metadata": {
    "createdAt": "2024-01-01T12:00:00Z",
    "updatedAt": "2024-01-01T12:00:30Z",
    "processingTime": 30000
  }
}
```

### Job Management Endpoints

#### Get Job Status
**GET** `/content-architect/job/{jobId}`

#### List Jobs
**GET** `/content-architect/jobs?status=completed&userId=user-123&limit=50`

#### Get Available Workflows
**GET** `/content-architect/workflows`

#### Health Check
**GET** `/content-architect/health`

## Workflow Types

### 1. Standard Workflow
**Use Case**: General content generation
**Duration**: ~5 minutes
**Steps**:
- Bottom Layer: Intent analysis, keyword research
- Middle Layer: Content structuring, query optimization
- Top Layer: LLM content optimization

### 2. Research-Heavy Workflow
**Use Case**: Academic or authoritative content requiring extensive research
**Duration**: ~12 minutes
**Steps**:
- Bottom Layer: Intent analysis, keyword research, freshness aggregation
- Middle Layer: Content structuring, semantic relationship mapping
- Top Layer: Original research generation, content optimization, citation verification, E-E-A-T signals

### 3. SEO-Focused Workflow
**Use Case**: Content optimized for search engine visibility
**Duration**: ~8 minutes
**Steps**:
- Bottom Layer: Intent analysis, keyword research
- Middle Layer: Conversational query optimization, platform-specific tuning, content structuring
- Top Layer: Content optimization, schema markup generation

### 4. Citation-Heavy Workflow
**Use Case**: Content requiring extensive citation verification and authority building
**Duration**: ~10 minutes
**Steps**:
- Bottom Layer: Intent analysis, keyword research
- Middle Layer: Content structuring
- Top Layer: Content optimization, citation verification, E-E-A-T signal generation

## Asynchronous Processing

### Azure Service Bus Integration

The orchestration layer uses Azure Service Bus for scalable asynchronous job processing:

1. **Job Queueing**: Content generation requests are queued in the `content-jobs` Service Bus queue
2. **Azure Function Processing**: Azure Functions consume messages and execute workflows
3. **Status Updates**: Job status and progress are updated in real-time
4. **Callback Notifications**: Optional webhooks notify clients when jobs complete

### Configuration

```bash
# Azure Service Bus
AZURE_SERVICE_BUS_CONNECTION_STRING=Endpoint=sb://...

# Job Processing
JOB_MAX_RETRIES=3
JOB_TIMEOUT_MINUTES=15

# Callback Configuration
CALLBACK_TIMEOUT_MS=30000
CALLBACK_RETRY_ATTEMPTS=3
```

## Real-time Updates

### WebSocket/SignalR Integration

The system provides real-time progress updates through WebSocket connections:

```typescript
// Client-side connection
const connection = new signalR.HubConnectionBuilder()
  .withUrl("/hubs/content-progress")
  .build();

// Subscribe to job updates
connection.invoke("SubscribeToJob", jobId);

// Handle progress updates
connection.on("JobUpdate", (update) => {
  console.log(`Job ${update.jobId}: ${update.type}`, update.data);
});
```

### Update Types

- **status_change**: Job status transitions (queued → processing → completed)
- **progress_update**: Step-by-step progress with percentage completion
- **step_completed**: Individual workflow step completion
- **error**: Error notifications with details
- **result_ready**: Final content delivery notification

## Error Handling

### Graceful Degradation

The orchestration layer implements comprehensive error handling:

1. **Layer Service Failures**: Individual layer service failures are caught and logged
2. **Workflow Interruption**: Failed steps stop workflow execution with detailed error reporting
3. **Job Retry Mechanism**: Failed jobs can be automatically or manually retried
4. **Fallback Responses**: Partial results are returned when possible

### Error Types

```typescript
// Service Layer Errors
{
  "error": "LayerServiceError",
  "message": "Bottom layer service 'queryIntentAnalyzer' failed",
  "details": {
    "layer": "bottom",
    "service": "queryIntentAnalyzer",
    "originalError": "Network timeout"
  }
}

// Workflow Errors
{
  "error": "WorkflowExecutionError",
  "message": "Workflow step 'analyze_intent' failed",
  "details": {
    "step": "analyze_intent",
    "completedSteps": [],
    "failureReason": "Service unavailable"
  }
}

// Job Management Errors
{
  "error": "JobNotFoundError",
  "message": "Job not found: job-123",
  "details": {
    "jobId": "job-123",
    "requestedBy": "user-456"
  }
}
```

## Performance Optimization

### Concurrent Processing

- **Layer Parallelization**: Independent steps within layers execute concurrently
- **Service Optimization**: Connection pooling and request batching for external services
- **Caching Strategy**: Intelligent caching of intermediate results

### Monitoring Metrics

```typescript
// Performance Metrics
{
  "averageProcessingTime": 4500, // milliseconds
  "successRate": 95.5, // percentage
  "concurrentJobs": 12,
  "queueDepth": 3,
  "layerPerformance": {
    "bottom": { "avgTime": 1200, "successRate": 98.2 },
    "middle": { "avgTime": 1800, "successRate": 96.8 },
    "top": { "avgTime": 1500, "successRate": 94.1 }
  }
}
```

## Deployment

### Azure Function Deployment

```bash
# Install Azure Functions Core Tools
npm install -g azure-functions-core-tools@4

# Deploy function
cd azure-functions
func azure functionapp publish your-function-app-name
```

### Environment Configuration

```bash
# Production Environment Variables
NODE_ENV=production
AZURE_SERVICE_BUS_CONNECTION_STRING=your-connection-string
CONTENT_ARCHITECT_API_URL=https://your-api.com
INTERNAL_API_TOKEN=your-internal-token

# Monitoring
APPLICATIONINSIGHTS_CONNECTION_STRING=your-app-insights-connection
```

## Testing

### Integration Tests

```bash
# Run orchestration integration tests
npm test -- src/components/orchestrator/__tests__/orchestration.integration.spec.ts

# Run specific test suites
npm test -- --testNamePattern="End-to-End Orchestration"
```

### Load Testing

```bash
# Simulate high-volume job processing
npm run test:load -- --jobs=100 --concurrent=10 --duration=300
```

## Monitoring and Observability

### Application Insights Integration

The orchestration layer provides comprehensive telemetry:

- **Custom Events**: Job lifecycle events, workflow execution steps
- **Performance Metrics**: Processing times, success rates, queue depths
- **Exception Tracking**: Detailed error logging with context
- **Dependency Tracking**: External service call monitoring

### Health Checks

```bash
# System health endpoint
curl https://your-api.com/content-architect/health

# Detailed component health
curl https://your-api.com/health/orchestration
```

## Best Practices

### Workflow Design

1. **Idempotent Steps**: Ensure workflow steps can be safely retried
2. **Dependency Management**: Clearly define step dependencies
3. **Timeout Configuration**: Set appropriate timeouts for each step
4. **Error Boundaries**: Implement proper error handling at each layer

### Job Management

1. **Priority Queuing**: Use priority levels for urgent content requests
2. **Resource Allocation**: Monitor and limit concurrent job execution
3. **Cleanup Policies**: Implement automatic cleanup of old completed jobs
4. **Retry Strategies**: Configure exponential backoff for failed jobs

### Performance Tuning

1. **Connection Pooling**: Reuse connections to external services
2. **Batch Processing**: Group similar operations when possible
3. **Caching Strategy**: Cache expensive operations and external API calls
4. **Resource Monitoring**: Track memory and CPU usage patterns

## Troubleshooting

### Common Issues

1. **High Queue Depth**: Scale Azure Functions or optimize workflow performance
2. **Job Timeouts**: Increase timeout values or optimize layer service performance
3. **Memory Issues**: Monitor job payload sizes and implement streaming for large content
4. **Service Bus Throttling**: Implement exponential backoff and connection management

### Debug Mode

```bash
# Enable detailed logging
DEBUG=orchestration:* npm start

# Monitor job processing
curl https://your-api.com/content-architect/jobs?status=processing
```

## Future Enhancements

### Planned Features

1. **Custom Workflow Builder**: Visual workflow designer for custom content pipelines
2. **A/B Testing Framework**: Compare different workflow configurations
3. **Machine Learning Optimization**: AI-powered workflow optimization based on performance data
4. **Multi-tenant Support**: Isolated workflows and job management per tenant
5. **Advanced Scheduling**: Cron-based job scheduling and recurring content generation
