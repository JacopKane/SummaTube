# GitHub Copilot Context for SummaTube

## Project Overview

SummaTube is a YouTube video summarization application that displays users' YouTube feed with AI-generated summaries of video content. The application uses intelligent caching and quota management to provide reliable service while respecting API limits.

## Tech Stack

- **Backend**: NestJS, Google APIs (YouTube Data API), OpenAI API
- **Frontend**: NextJS, React, TailwindCSS, React Query
- **Infrastructure**: Docker, Docker Compose

## Key Features

- YouTube OAuth authentication with proper scope handling
- Real-time YouTube feed display with smart caching
- AI-powered video transcript summarization using OpenAI
- Intelligent API quota management with warning systems
- Multi-level fallback systems for transcript retrieval:
  - YouTube Data API captions
  - Alternative caption access methods
  - TimedText API fallbacks
  - Video description fallback
- User-configurable cache settings with import/export functionality
- Responsive UI with loading states and lazy loading

## Project Structure

- `backend/`: NestJS API server with modules for auth, YouTube API integration, and OpenAI summarization
- `frontend/`: NextJS application with React components, hooks, and utility functions
- `docker-compose.yml`: Production Docker setup
- `docker-compose.dev.yml`: Development Docker setup with volume mounts and hot-reloading
- `dev.sh`: Development environment startup script

## Environment Variables

### Backend (.env)

- `PORT`: Server port (default: 8001)
- `FRONTEND_URL`: Frontend URL for CORS
- `YOUTUBE_CLIENT_ID`: Google OAuth client ID
- `YOUTUBE_CLIENT_SECRET`: Google OAuth client secret
- `YOUTUBE_CALLBACK_URL`: YouTube OAuth callback URL
- `OPENAI_API_KEY`: OpenAI API key
- `OPENAI_MODEL`: OpenAI model to use (default: gpt-4)
- `MAX_TOKENS_PER_SUMMARIZATION`: Maximum tokens for summarization (default: 2000)

### Frontend (.env)

- `NEXT_PUBLIC_API_URL`: Backend API URL

## Development Workflow

1. Clone the repository
2. Configure environment variables in backend/.env and frontend/.env
3. Run `./dev.sh` to start the development environment
4. The frontend will be available at http://localhost:8000
5. The backend API will be available at http://localhost:8001/api

## Important Design Patterns

### API Optimization System

- **Smart Caching**: The application implements tiered caching with configurable TTLs:

  - Feed data caches for 24 hours by default
  - Summaries cache for 7 days by default
  - Both in-memory and localStorage caching systems
  - Cache expiration detection and automatic cleanup

- **Quota Management**:

  - Frontend tracks API usage in localStorage
  - Warns users when approaching YouTube API limits
  - Falls back to cached data when quota is exceeded
  - Backend provides detailed quota error handling

- **API Request Throttling**:

  - Implements `apiThrottler` to stagger requests
  - Prevents bursts of API requests
  - Maintains a priority queue of requests
  - Enforces minimum delay between requests

- **Fault Tolerance**:
  - Multiple fallback mechanisms for transcript retrieval
  - Graceful error handling with user-friendly messages
  - Permission error detection and reauthorization flow
  - Expired cache data used as fallback during API errors

### Code Architecture

- Component-based UI architecture with React
- Service-based backend architecture with NestJS
- API endpoints follow RESTful design with proper DTOs
- Error handling with detailed typing and contextual messages

## Code Conventions

- TypeScript interfaces for type safety
- React functional components with hooks
- NestJS dependency injection for backend services
- API endpoints prefixed with /api
- OAuth2 for authentication with proper scope handling

## Advanced Features

- **Progressive Summarization**: Handles long transcripts by:

  - Breaking content into manageable chunks
  - Summarizing each chunk separately
  - Recursively summarizing the combined results
  - Handling batches optimally for OpenAI token limits

- **Error Recovery**:
  - Cache items survive client-side errors
  - Server maintains disk cache as additional fallback
  - Session storage tracks quota status across page loads
  - Permission errors prompt reauthorization with proper scopes
