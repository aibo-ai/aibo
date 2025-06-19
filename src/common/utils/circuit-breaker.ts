/**
 * Circuit Breaker implementation for handling failing services
 */

export interface CircuitBreakerOptions {
  failureThreshold: number; // Number of failures before opening the circuit
  resetTimeout: number;     // Time in ms to wait before attempting to close the circuit
  successThreshold: number; // Number of successful calls before closing the circuit
  timeout: number;          // Time in ms before a request is considered a failure
}

export const DEFAULT_CIRCUIT_BREAKER_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 3,
  resetTimeout: 30000, // 30 seconds
  successThreshold: 2,
  timeout: 10000, // 10 seconds
};

export class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF-OPEN';
  private failureCount: number;
  private successCount: number;
  private lastFailureTime: number | null;
  private readonly options: CircuitBreakerOptions;

  constructor(options: Partial<CircuitBreakerOptions> = {}) {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.options = { ...DEFAULT_CIRCUIT_BREAKER_OPTIONS, ...options };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      // Check if we should attempt to close the circuit
      if (this.shouldAttemptReset()) {
        this.state = 'HALF-OPEN';
        this.lastFailureTime = null;
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      // Execute the function with a timeout
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), this.options.timeout)
        )
      ]);

      return this.onSuccess(result);
    } catch (error) {
      return this.onFailure(error);
    }
  }

  private onSuccess<T>(result: T): T {
    if (this.state === 'HALF-OPEN') {
      this.successCount++;
      
      if (this.successCount >= this.options.successThreshold) {
        this.reset();
      }
    }
    
    // Reset failure count on successful request
    this.failureCount = 0;
    
    return result;
  }

  private async onFailure<T>(error: Error): Promise<T> {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF-OPEN' || 
        (this.state === 'CLOSED' && this.failureCount >= this.options.failureThreshold)) {
      this.state = 'OPEN';
    }

    throw error;
  }

  private shouldAttemptReset(): boolean {
    if (this.state !== 'OPEN') return false;
    if (!this.lastFailureTime) return true;
    
    const timeSinceFailure = Date.now() - this.lastFailureTime;
    return timeSinceFailure >= this.options.resetTimeout;
  }

  private reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
  }

  getState(): { state: string; failureCount: number; lastFailureTime: number | null } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
    };
  }
}

/**
 * Creates a circuit breaker instance with the given options
 */
export function createCircuitBreaker(options: Partial<CircuitBreakerOptions> = {}): CircuitBreaker {
  return new CircuitBreaker(options);
}
