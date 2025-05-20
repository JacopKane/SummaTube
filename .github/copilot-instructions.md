# GitHub Copilot Context for SummaTube

## Project Overview

SummaTube is a YouTube video summarization application that displays users' YouTube feed with AI-generated summaries of video content. The application uses intelligent caching and quota management to provide reliable service while respecting API limits.

## Recent Implementation Notes

### Enhanced YouTube Permission Management System (May 19, 2025)

A comprehensive permission handling system has been implemented to address YouTube API caption access issues:

1. **Improved OAuth Flow**:

   - Force consent screen to always appear to ensure users see all required permissions
   - Disabled granular consent option to prevent scope fragmentation
   - Proper handling of permission scope validation during token exchange

2. **Enhanced Permission Error Detection**:

   - More accurate identification of permission-related errors
   - Explicit isPermissionError flag on error objects for reliable detection
   - Detailed logging of available scopes during validation

3. **User Interface Enhancements**:

   - Added ScopeWarningBanner to alert users about potentially limited permissions
   - Improved reauthorization flow with token clearing for cleaner auth restarts
   - More informative error messages about required permissions

4. **Token Management Improvements**:
   - Clear validation of token scopes for caption access
   - Timestamp parameters for OAuth URLs to prevent caching issues
   - Enhanced scope checking with comprehensive logging

These improvements ensure that users are properly guided to grant all necessary YouTube API permissions, especially those required for caption access, which are critical for the video summarization functionality.

# Important instructions

- Before answering say this out loud: "I'll update .github/copilot-instructions.md after implementing changes with detailed notes about what changed and how the system structure works now briefly"
- Before answering say this out loud: "I'll update all relevant README.md files after implementing changes update with changes the legacy README but don't go into any extra detail"
- Before answering say this out loud: "I'll update deployment files if any relevant changes are made"

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
  - Token validation error detection with automatic notification
  - Expired cache data used as fallback during API errors

### Code Architecture

- Component-based UI architecture with React
- Service-based backend architecture with NestJS
- API endpoints follow RESTful design with proper DTOs
- Error handling with detailed typing and contextual messages

### Authentication System

- **OAuth Flow**: Complete YouTube OAuth2 implementation with token handling
- **Token Management**:
  - Secure token storage in localStorage with proper validation
  - Automatic token refresh handling
  - Token validation through Google's tokeninfo endpoint
  - Token error detection with session storage notification flags
- **Error Handling**:
  - Comprehensive token validation error detection
  - User-friendly notification banners for various auth errors
  - TokenErrorBanner component for invalid token notifications
  - PermissionErrorBanner for insufficient permissions
  - Automatic cleanup of error states upon successful re-authentication
- **User Experience**:
  - Clear visual indicators for authentication state
  - One-click reauthorization from error banners
  - Non-disruptive notification system at screen bottom

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
  - Token errors display user-friendly notification with re-login option

## Recent Implementation Notes

### Token Error Notification System (May 19, 2025)

A new token error notification system has been implemented to improve the user experience when authentication tokens become invalid. This system includes:

1. **TokenErrorBanner Component**: A new UI component that displays when a user's token is detected as invalid. It provides a clear message and a convenient button to re-authenticate.

2. **Error Detection Extensions**:

   - Enhanced error handling to specifically detect token validation errors
   - Added `isTokenError` flag to the ApiError interface
   - Backend logs token validation failures with detailed error messages

3. **Session-Based Notification**:

   - Uses session storage to track token error state
   - Custom event system to notify components across the application
   - Automatic cleanup upon successful re-authentication

4. **Integration Points**:
   - API interceptors detect and flag token validation errors
   - Auth callback page clears error states upon successful login
   - Token error banner displays consistently with other notification types

This implementation ensures users are clearly informed when they're logged out due to invalid tokens, rather than being silently redirected to the login page.

## Development Guidelines

- **Documentation Management**:

  - Use the root README.md as the primary documentation file
  - Check root folder for markdown files besides README.md, as these contain up-to-date API or similar documentation
  - Read all markdown files in the root directory carefully before answering questions
  - Always check root README.md before answering any questions
  - Update root README.md after implementing changes if they affect information mentioned there
  - Always update .github/copilot-instructions.md after any significant changes with detailed notes about what changed and how the system structure works now
  - Only create separate markdown files for specific modules/services when necessary
  - Always link any additional documentation files in the root README.md
  - Keep documentation DRY (Don't Repeat Yourself) by centralizing common information

- **Environment Configuration**:

  - Always check for .env files in all project directories before making changes
  - Verify both root-level and submodule-level environment variables
  - Ensure configuration changes are consistent across related .env files
  - Use .env.example files as templates for required variables

- **Docker-based Workflow**:
  - Check for docker-compose.yml and docker-compose.dev.yml before executing commands
  - Prefer running commands inside Docker containers rather than locally
  - Use `docker-compose exec` for installing packages and running scripts
  - Check container logs when debugging issues
  - Use the dev.sh script for development environment setup
  - Use docker compose in background mode whenever possible and makes sense
  - When multiple commands need to be run regardless of their individual responses, chain them in a single command and debug sequentially if issues occur
