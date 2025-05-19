/**
 * API Throttler for YouTube API requests
 *
 * This utility helps prevent hitting YouTube API quota limits by:
 * 1. Staggering API requests to avoid bursts
 * 2. Tracking the number of requests in a given time period
 * 3. Providing methods to check if more requests can be made
 */

type RequestQueue = {
  id: string;
  execute: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  priority: number;
};

class ApiThrottler {
  private queue: RequestQueue[] = [];
  private processing: boolean = false;
  private requestsInLastMinute: number = 0;
  private requestsTimeLog: number[] = [];
  private maxRequestsPerMinute: number = 60; // YouTube API typically allows 60-100 requests per minute
  private minDelayBetweenRequests: number = 1000; // 1 second minimum between requests
  private lastRequestTime: number = 0;

  constructor(maxPerMinute = 60, minDelay = 1000) {
    this.maxRequestsPerMinute = maxPerMinute;
    this.minDelayBetweenRequests = minDelay;
  }

  /**
   * Add a request to the throttling queue
   * @param id Unique identifier for the request
   * @param executeRequest Function that executes the API request
   * @param priority Lower number = higher priority
   */
  public enqueue<T>(
    id: string,
    executeRequest: () => Promise<T>,
    priority = 10
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        id,
        execute: executeRequest,
        resolve,
        reject,
        priority,
      });

      this.queue.sort((a, b) => a.priority - b.priority);

      // Start processing if not already running
      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  /**
   * Process the queue of API requests with throttling
   */
  private async processQueue() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;

    // Check if we can make another request
    if (this.canMakeRequest()) {
      const request = this.queue.shift();
      if (!request) {
        this.processing = false;
        return;
      }

      // Calculate how long to wait before making the next request
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      const delayNeeded = Math.max(
        0,
        this.minDelayBetweenRequests - timeSinceLastRequest
      );

      // Wait if needed
      if (delayNeeded > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayNeeded));
      }

      // Log this request
      this.lastRequestTime = Date.now();
      this.requestsTimeLog.push(this.lastRequestTime);
      this.updateRequestsCount();

      // Execute the request
      try {
        const result = await request.execute();
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      }

      // Continue processing queue after a short delay
      setTimeout(() => this.processQueue(), 100);
    } else {
      // Wait and try again
      console.log(
        "API throttler: Rate limit reached, waiting before next request"
      );
      setTimeout(() => this.processQueue(), 2000);
    }
  }

  /**
   * Check if we can make another request based on our rate limits
   */
  private canMakeRequest(): boolean {
    this.updateRequestsCount();
    return this.requestsInLastMinute < this.maxRequestsPerMinute;
  }

  /**
   * Update the count of requests in the last minute
   */
  private updateRequestsCount() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Filter out requests older than 1 minute
    this.requestsTimeLog = this.requestsTimeLog.filter(
      (time) => time > oneMinuteAgo
    );
    this.requestsInLastMinute = this.requestsTimeLog.length;
  }

  /**
   * Get the current request rate (requests per minute)
   */
  public getCurrentRate(): number {
    this.updateRequestsCount();
    return this.requestsInLastMinute;
  }

  /**
   * Clear the queue, canceling all pending requests
   */
  public clearQueue(error: Error = new Error("Queue cleared")): void {
    const pendingRequests = [...this.queue];
    this.queue = [];

    pendingRequests.forEach((request) => {
      request.reject(error);
    });
  }
}

// Create a singleton instance
export const apiThrottler = new ApiThrottler();

// Export a simple function to enqueue requests
export function throttledRequest<T>(
  id: string,
  executeRequest: () => Promise<T>,
  priority = 10
): Promise<T> {
  return apiThrottler.enqueue(id, executeRequest, priority);
}
