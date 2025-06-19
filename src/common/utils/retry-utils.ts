/**
 * Utility functions for retrying operations with exponential backoff
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  factor?: number;
  jitter?: boolean;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  factor: 2,
  jitter: true
};

/**
 * Executes an async function with retry logic and exponential backoff
 * @param fn The async function to execute
 * @param options Retry configuration options
 */
export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries, initialDelayMs, maxDelayMs, factor, jitter } = {
    ...DEFAULT_RETRY_OPTIONS,
    ...options
  };

  let lastError: Error;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry for 4xx errors (except 429 - Too Many Requests)
      if (error.response?.status >= 400 && 
          error.response?.status < 500 && 
          error.response?.status !== 429) {
        throw error;
      }

      // If we've reached max retries, throw the last error
      if (attempt === maxRetries) {
        const error = new Error(
          `Max retries (${maxRetries}) exceeded. Last error: ${lastError.message}`
        );
        (error as any).cause = lastError;
        throw error;
      }

      // Calculate delay with exponential backoff and optional jitter
      const delay = Math.min(
        initialDelayMs * Math.pow(factor, attempt),
        maxDelayMs
      ) * (jitter ? 0.5 * (1 + Math.random()) : 1);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      attempt++;
    }
  }

  // This should never be reached due to the while loop, but TypeScript needs it
  throw lastError;
}

/**
 * Creates a retryable version of an async function
 * @param fn The async function to make retryable
 * @param options Retry configuration options
 */
export function retryable<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions = {}
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    return withRetry(
      async () => fn(...args),
      options
    );
  };
}

/**
 * Creates a retryable API client method
 * @param target The target object
 * @param methodName The method name to make retryable
 * @param options Retry configuration options
 */
export function retryableMethod(
  target: any,
  methodName: string,
  options: RetryOptions = {}
) {
  const originalMethod = target[methodName];
  
  if (typeof originalMethod !== 'function') {
    throw new Error(`Cannot apply @retryable to non-method ${methodName}`);
  }
  
  target[methodName] = function(...args: any[]) {
    return withRetry(
      async () => originalMethod.apply(this, args),
      options
    );
  };
  
  return target;
}

/**
 * Class decorator to make all methods retryable
 * @param options Retry configuration options
 */
export function Retryable(options: RetryOptions = {}) {
  return function (constructor: Function) {
    const methods = Object.getOwnPropertyNames(constructor.prototype)
      .filter(prop => prop !== 'constructor' && typeof constructor.prototype[prop] === 'function');
    
    methods.forEach(methodName => {
      const descriptor = Object.getOwnPropertyDescriptor(constructor.prototype, methodName);
      if (descriptor && typeof descriptor.value === 'function') {
        const originalMethod = descriptor.value;
        descriptor.value = async function(...args: any[]) {
          return withRetry(
            async () => originalMethod.apply(this, args),
            options
          );
        };
        Object.defineProperty(constructor.prototype, methodName, descriptor);
      }
    });
  };
}
