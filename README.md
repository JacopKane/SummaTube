# SummaTube

A YouTube video summarization app that provides AI-generated summaries of videos in your YouTube feed, saving you time and helping you decide which videos to watch. Built with NestJS (backend) and NextJS (frontend), and fully dockerized for easy deployment.

## Features

- **YouTube Integration**: OAuth authentication with comprehensive permission handling and real-time feed display
- **AI Summaries**: OpenAI-powered video transcript analysis and summarization
- **Smart Caching**: Advanced multi-tiered caching system to minimize API usage
- **Quota Protection**: API usage tracking with warnings and fallback systems
- **UI Experience**: Responsive design with loading states and lazy loading
- **User Controls**: Configurable cache settings with import/export functionality

## Project Architecture

```
SummaTube/
├── backend/            # NestJS API server with YouTube and OpenAI integration
├── frontend/           # NextJS frontend with React components and utilities
├── docker-compose.yml  # Production Docker configuration
└── dev.sh              # Development startup script
```

## API Optimization System

The application implements multiple layers of protection against API quota limits:

- **Intelligent Caching**:

  - Configurable TTLs for feed data (24h default) and summaries (7d default)
  - Both client-side and server-side caching mechanisms
  - Automatic cache validation and cleanup

- **Quota Management**:

  - Tracks API usage and warns users when approaching limits
  - Gracefully falls back to cached data when quotas are exceeded
  - Provides clear error messages and recovery options

- **Request Handling**:
  - Priority-based request queue for efficient API usage
  - Enforced delays between requests to prevent rate limiting
  - Lazy loading to minimize initial API calls

## Prerequisites

- Node.js 18+
- Docker and Docker Compose
- YouTube API credentials (OAuth 2.0)
- OpenAI API key

## Setup Instructions

### 1. Configuration

#### Backend

Create and configure the backend environment variables:

```bash
cp backend/.env.example backend/.env
```

Then customize `backend/.env` with your credentials:

```
# Server Configuration
PORT=8001

# Frontend URL for CORS
FRONTEND_URL=http://localhost:8000

# YouTube API Configuration
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
YOUTUBE_CALLBACK_URL=http://localhost:8001/api/auth/youtube/callback

# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4

# Max tokens to process in each summarization step
MAX_TOKENS_PER_SUMMARIZATION=2000
```

#### Frontend

Create and configure the frontend environment variables:

```bash
cp frontend/.env.example frontend/.env
```

Set the API URL in `frontend/.env`:

```
NEXT_PUBLIC_API_URL=http://localhost:8001/api
```

### 2. Development Environment

The easiest way to start development is using the provided script:

```bash
./dev.sh
```

This script:

- Sets up Docker containers with hot-reloading
- Mounts volumes for live code changes
- Makes the frontend available at http://localhost:8000
- Makes the backend API available at http://localhost:8001/api

### 3. Production Deployment

For production deployment, use:

```bash
docker-compose up -d
```

## System Architecture

### Data Flow

1. User authenticates via YouTube OAuth
2. App fetches the YouTube feed with API quota awareness
3. For each video, it attempts to retrieve captions through multiple methods:
   - Primary: YouTube Data API captions endpoint
   - Fallback 1: Alternative caption access methods
   - Fallback 2: TimedText API for community captions
   - If no captions available: Shows clear error message
4. Retrieved content is processed by OpenAI using progressive summarization:
   - Large transcripts are split into manageable chunks
   - Each chunk is summarized separately
   - Results are recursively combined and summarized again
5. Summaries are cached at multiple levels and displayed with status indicators

### Performance Optimization

- **Lazy Loading**: Video summaries are only loaded as they enter viewport
- **Smart Cache Management**: Configurable TTLs with auto-cleanup
- **API Throttling**: Request prioritization with enforced delays
- **Error Recovery**: Multiple fallback mechanisms for failed requests

### Best Practices for Users

- Enable "Prefer Cache" in settings to minimize API usage
- Use the cache export/import feature for backup
- Monitor quota warnings to avoid hitting YouTube API limits
