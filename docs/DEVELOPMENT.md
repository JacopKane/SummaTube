# SummaTube Development Guide

This document provides detailed information for developers working on the SummaTube project.

## Development Environment Setup

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- Google Developer Account (for YouTube API access)
- OpenAI API access

### Getting Started

1. Clone the repository
2. Configure environment variables as described in the main README
3. Run the development script:

```bash
./dev.sh
```

## Technical Architecture

### Backend (NestJS)

The backend follows a modular architecture with these key components:

- **AuthModule**: Handles YouTube OAuth authentication
- **YouTubeModule**: Manages YouTube API interactions with quota handling
- **SummaryModule**: Processes transcripts with OpenAI summarization

#### Key Services

- **YoutubeService**:

  - Manages YouTube API interactions with multi-level fallbacks
  - Implements in-memory caching with disk persistence
  - Handles quota error detection and recovery

- **SummaryService**:
  - Processes transcripts in chunks for optimal summarization
  - Implements recursive summarization for long content
  - Manages OpenAI API interactions with error handling
  - Provides cache mechanisms for summaries

### Frontend (NextJS)

The frontend follows a component-based architecture:

- **Pages**: Main application routes
- **Components**: Reusable UI elements
- **Hooks**: Custom React hooks for data fetching and functionality
- **Utils**: Utility functions for API, caching, and error handling

#### Key Utilities

- **apiThrottler.ts**:

  - Manages API request pacing to avoid quota issues
  - Implements priority-based queue system
  - Staggers requests with configurable delays

- **cacheManager.ts**:
  - Manages localStorage-based caching
  - Tracks and maintains cache TTLs
  - Handles quota tracking and warning system
  - Provides cache export/import functionality

## API Optimization System

### Smart Caching

The application uses a multi-tiered caching system:

1. **Client-side Cache**:

   - localStorage-based caching for feed and summaries
   - Configurable TTLs (24h for feed, 7d for summaries by default)
   - Size monitoring and auto-cleanup

2. **Server-side Cache**:
   - In-memory cache for active sessions
   - Disk-based cache as additional fallback
   - Automatic fallback to expired cache during quota errors

### YouTube API Considerations

1. **Quota Awareness**:

   - Each account has daily quota limits (~10,000 units)
   - Feed fetches use ~1-5 units per channel
   - Caption fetches use ~1-3 units per video

2. **Error Handling Strategy**:
   - Permission errors trigger reauthorization flow
   - Quota errors fall back to cached data
   - Caption access errors cascade through fallback methods

## Testing

### Manual Testing Focus Areas

1. **Authentication Flow**:

   - Fresh login
   - Token refresh
   - Permission error recovery

2. **Quota Management**:

   - Warning display when approaching limits
   - Proper fallback to cache when quota exceeded
   - Recovery after quota reset

3. **Cache Functionality**:
   - Cache settings changes apply correctly
   - Import/export functionality works
   - Cache cleanup performs as expected

## Common Issues

### YouTube API Access

- Ensure proper OAuth scopes for YouTube Data API
- Caption access may fail due to video owner restrictions
- Quota resets daily at midnight Pacific Time

### OpenAI Integration

- Token limits may require adjusting MAX_TOKENS_PER_SUMMARIZATION
- Rate limits can occur with high usage
- Costs increase with transcript length and complexity
