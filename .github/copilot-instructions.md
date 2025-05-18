# GitHub Copilot Context for SummaTube

## Project Overview

SummaTube is a YouTube video summarization application that displays the user's YouTube feed with AI-generated summaries of video content. The project consists of:

- NestJS backend API server
- NextJS frontend application
- Full Docker containerization for development and production

## Tech Stack

- **Backend**: NestJS, TypeORM, PostgreSQL, Google APIs (YouTube Data API), OpenAI API
- **Frontend**: NextJS, React, TailwindCSS, React Query
- **Infrastructure**: Docker, Docker Compose

## Key Features

- YouTube OAuth authentication
- Real-time YouTube feed display
- AI-powered video transcript summarization using OpenAI
- Smart caching system to minimize YouTube API quota usage
- Quota management to track and warn about approaching API limits
- User-configurable cache settings with import/export functionality
- Responsive UI with loading states and lazy loading

## Project Structure

- `backend/`: NestJS API server with modules for auth, YouTube API integration, and OpenAI summarization
- `frontend/`: NextJS application with React components, hooks, and utility functions
- `docker-compose.yml`: Production Docker setup
- `docker-compose.dev.yml`: Development Docker setup with volume mounts and hot-reloading
- `dev.sh`: Development environment startup script

## Environment Variables

The project requires several environment variables to function:

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

- Smart caching system to minimize API calls
- Rate limiting and request throttling for API optimization
- Component-based UI architecture
- Service-based backend architecture
- RESTful API design with DTOs for data transfer

## Code Conventions

- TypeScript interfaces for type safety
- React functional components with hooks
- NestJS dependency injection for backend services
- API endpoints prefixed with /api
- OAuth2 for authentication
