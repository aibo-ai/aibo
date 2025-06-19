import * as appInsights from "applicationinsights";

let client: appInsights.TelemetryClient | null = null;

/**
 * Initialize Application Insights
 */
export function setupAppInsights(): appInsights.TelemetryClient | null {
  try {
    const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;
    
    if (!connectionString) {
      console.warn("APPLICATIONINSIGHTS_CONNECTION_STRING not found. Application Insights will not be initialized.");
      return null;
    }

    // Configure Application Insights
    appInsights.setup(connectionString)
      .setAutoDependencyCorrelation(true)
      .setAutoCollectRequests(true)
      .setAutoCollectPerformance(true, true)
      .setAutoCollectExceptions(true)
      .setAutoCollectDependencies(true)
      .setAutoCollectConsole(true)
      .setUseDiskRetryCaching(true)
      .setSendLiveMetrics(false)
      .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C);

    // Start Application Insights
    appInsights.start();
    
    client = appInsights.defaultClient;
    
    // Set default properties
    client.commonProperties = {
      service: "freshness-aggregator",
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "production"
    };

    console.log("Application Insights initialized successfully");
    return client;
    
  } catch (error) {
    console.error("Failed to initialize Application Insights:", error);
    return null;
  }
}

/**
 * Get the current Application Insights client
 */
export function getAppInsightsClient(): appInsights.TelemetryClient | null {
  return client;
}

/**
 * Track a custom event
 */
export function trackEvent(name: string, properties?: { [key: string]: string }, measurements?: { [key: string]: number }): void {
  if (client) {
    client.trackEvent({
      name,
      properties,
      measurements
    });
  }
}

/**
 * Track a custom metric
 */
export function trackMetric(name: string, value: number, properties?: { [key: string]: string }): void {
  if (client) {
    client.trackMetric({
      name,
      value,
      properties
    });
  }
}

/**
 * Track an exception
 */
export function trackException(exception: Error, properties?: { [key: string]: string }): void {
  if (client) {
    client.trackException({
      exception,
      properties
    });
  }
}

/**
 * Track a dependency call
 */
export function trackDependency(
  dependencyTypeName: string,
  name: string,
  data: string,
  duration: number,
  success: boolean,
  properties?: { [key: string]: string }
): void {
  if (client) {
    client.trackDependency({
      dependencyTypeName,
      name,
      data,
      duration,
      success,
      properties
    });
  }
}

/**
 * Track a custom request
 */
export function trackRequest(
  name: string,
  url: string,
  duration: number,
  responseCode: string,
  success: boolean,
  properties?: { [key: string]: string }
): void {
  if (client) {
    client.trackRequest({
      name,
      url,
      duration,
      responseCode,
      success,
      properties
    });
  }
}

/**
 * Flush all pending telemetry
 */
export function flush(): Promise<void> {
  return new Promise((resolve) => {
    if (client) {
      client.flush({
        callback: () => resolve()
      });
    } else {
      resolve();
    }
  });
}

/**
 * Create a correlation context for tracking related operations
 */
export function createCorrelationContext(operationId: string): any {
  if (client && appInsights.getCorrelationContext) {
    const context = appInsights.getCorrelationContext();
    if (context) {
      context.operation.id = operationId;
      return context;
    }
  }
  return null;
}

/**
 * Utility function to measure execution time of async operations
 */
export async function measureAsync<T>(
  name: string,
  operation: () => Promise<T>,
  properties?: { [key: string]: string }
): Promise<T> {
  const startTime = Date.now();
  let success = true;
  let error: Error | null = null;

  try {
    const result = await operation();
    return result;
  } catch (err) {
    success = false;
    error = err as Error;
    throw err;
  } finally {
    const duration = Date.now() - startTime;
    
    // Track as dependency
    trackDependency(
      "Operation",
      name,
      name,
      duration,
      success,
      {
        ...properties,
        ...(error && { error: error.message })
      }
    );
    
    // Track as metric
    trackMetric(
      `${name}.Duration`,
      duration,
      {
        ...properties,
        success: success.toString()
      }
    );
  }
}
