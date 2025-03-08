import { NetworkError, WalletError } from './errorHandling';

interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryableErrors?: Array<string | RegExp>;
}

const defaultOptions: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryableErrors: [
    'network error',
    'timeout',
    'rate limit',
    /failed to fetch/i,
    /connection refused/i
  ]
};

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...defaultOptions, ...options };
  let lastError: Error | null = null;
  let attempt = 1;
  let delay = opts.initialDelay;

  while (attempt <= opts.maxAttempts) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if error is retryable
      const isRetryable = opts.retryableErrors.some(pattern => {
        if (typeof pattern === 'string') {
          return lastError!.message.toLowerCase().includes(pattern.toLowerCase());
        }
        return pattern.test(lastError!.message);
      });

      if (!isRetryable || attempt === opts.maxAttempts) {
        if (lastError.message.includes('network')) {
          throw new NetworkError(lastError.message);
        }
        if (lastError.message.includes('wallet')) {
          throw new WalletError(lastError.message);
        }
        throw lastError;
      }

      console.warn(`Attempt ${attempt} failed:`, lastError.message);
      console.log(`Retrying in ${delay}ms...`);

      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * opts.backoffFactor, opts.maxDelay);
      attempt++;
    }
  }

  throw lastError;
}