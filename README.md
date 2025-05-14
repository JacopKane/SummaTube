# SummaTube

A YouTube video summarization app that shows your YouTube feed with AI-generated summaries of video content. This app uses NestJS for the backend, NextJS for the frontend, and it's fully dockerized for easy deployment.

## Features

- YouTube account authentication
- Real-time YouTube feed display
- AI-powered video transcript summarization using OpenAI
- Responsive UI with loading states
- Dockerized for easy deployment

## Project Structure

```
SummaTube/
├── backend/            # NestJS API server
├── frontend/           # NextJS frontend application
└── docker-compose.yml  # Docker Compose configuration
```

## Prerequisites

- Node.js 18+
- Docker and Docker Compose
- YouTube API credentials
- OpenAI API key

## Setup Instructions

### 1. Configuration

#### Backend

Copy the `.env.example` file to create a `.env` file and configure it:

```bash
cp backend/.env.example backend/.env
```

Then edit `backend/.env` with your credentials:

```
# Server Configuration
PORT=3001

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000

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

Copy the `.env.example` file to create a `.env` file:

```bash
cp frontend/.env.example frontend/.env
```

### 2. Running with Docker

To start the application using Docker Compose:

```bash
docker-compose up -d
```

This will start both the backend and frontend services. The application will be available at:

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api

### 3. Running Locally for Development

#### Backend

```bash
cd backend
npm install
npm run start:dev
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## How It Works

1. Users authenticate with their YouTube account
2. The application fetches the user's YouTube feed
3. For each video, it retrieves the transcript
4. The transcript is sent to OpenAI API for summarization
5. Summarization happens in chunks to handle long transcripts
6. Summarized content is displayed in the feed
