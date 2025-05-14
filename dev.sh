#!/bin/bash

# Script to run docker-compose with the development configuration

echo "Starting development environment with Docker watch support..."
echo "Stopping any existing containers..."
docker compose -f docker-compose.yml -f docker-compose.dev.yml down

echo "Building and starting containers with logs..."
docker compose -f docker-compose.dev.yml up --build -d
