# SummaTube API Optimization Strategy

This document details the strategies implemented in SummaTube to optimize API usage, manage quotas, and ensure reliable service.

## YouTube API Quota Management

YouTube's Data API enforces daily quota limits (~10,000 units per day) that must be carefully managed.

### Quota Usage Tracking

The application tracks API usage with the following mechanisms:

1. **Client-side Tracking**:

   - Stores current usage in `localStorage` with date stamping
   - Resets counters at midnight Pacific Time
   - Provides warnings when approaching limits (~80% usage)

2. **Usage Estimation**:
   - Feed requests: ~1-5 units per request
   - Caption requests: ~1-3 units per video
   - Usage counters increment based on request type

### Quota Error Recovery

When quota limits are reached, the system implements these recovery strategies:

1. **Emergency Caching**:

   - Falls back to cached data regardless of expiration
   - Provides clear indication that data is from cache
   - Appends notes to summaries that are served from cache

2. **User Communication**:
   - Displays warning banners when approaching limits
   - Shows error messages explaining quota exceeded status
   - Provides information on when quotas will reset

## API Request Throttling

To avoid rate limits and distribute API calls evenly, SummaTube implements a sophisticated request throttling system.

### The `apiThrottler` Class

This utility manages API requests with these key features:

1. **Priority Queue**:

   - Requests are queued based on priority level
   - Critical requests (auth, feed) get higher priority
   - Less critical requests (summaries) get lower priority

2. **Request Pacing**:

   - Enforces minimum delay between requests (~1000ms default)
   - Tracks requests per minute to stay under rate limits
   - Automatically adjusts pacing based on response patterns

3. **Queue Management**:
   - Processes requests sequentially to avoid bursts
   - Allows cancellation of lower priority requests when needed
   - Provides feedback on request status

## Multi-level Caching System

The application implements comprehensive caching to minimize API usage.

### Client-side Cache (Browser)

1. **localStorage Cache**:

   - Feed data cached with 24h TTL (default)
   - Summaries cached with 7d TTL (default)
   - User-configurable TTL settings

2. **Cache Management**:
   - Size monitoring to prevent localStorage overflow
   - Optional automatic cleanup of expired items
   - Cache export/import functionality for backup

### Server-side Cache (Backend)

1. **In-memory Cache**:

   - Active session data cached in memory
   - Provides fastest possible response times
   - Reduces duplicate API calls

2. **Disk-based Persistence**:
   - Critical data persisted to disk as JSON
   - Survives server restarts
   - Acts as additional fallback layer

## Transcript Retrieval Fallback System

To maximize availability of content for summarization, the application implements a multi-level fallback system.

### Fallback Chain

1. **Standard YouTube Data API**:
   - Primary approach using official captions endpoint
   - Handles most public videos with captions
2. **Alternative Caption Access Methods**:

   - Attempts different parameter combinations
   - Uses various format options (SRT, SubViewer)
   - Implements direct URL fetch approaches

3. **TimedText API Fallback**:

   - Uses undocumented YouTube TimedText API
   - Attempts multiple language and format options
   - Works for some community caption scenarios

4. **Description Fallback**:
   - Uses video description as last resort
   - Formats description with video metadata
   - Adjusts summary prompt to handle description content

## Lazy Loading Implementation

To reduce initial API load, the frontend implements progressive loading.

### Scroll-based Loading

1. **Initial Load**:

   - Loads minimal set of videos (typically 6-9)
   - Pre-fetches summaries only for visible items

2. **Scroll Detection**:

   - Monitors scroll position with IntersectionObserver
   - Loads additional items as user scrolls
   - Staggers API requests to minimize impact

3. **Prioritization**:
   - Visible items get highest priority
   - Near-viewport items get medium priority
   - Off-screen items get lowest priority or deferred loading

## Future Optimization Opportunities

- **Predictive Loading**: Analyze user behavior to preload likely content
- **Differential Caching**: Adjust TTLs based on content popularity
- **Batch Processing**: Group related requests to reduce API calls
- **Worker Threads**: Offload processing to improve perceived performance
