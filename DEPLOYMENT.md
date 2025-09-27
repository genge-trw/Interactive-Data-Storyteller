# Deployment Guide

This guide provides instructions on how to deploy the Interactive Data Storyteller application using Docker and Docker Compose.

## Overview

The application consists of two main components:
1.  **Frontend:** A static web application served by Nginx.
2.  **Backend:** A Python Flask application that handles sentiment analysis and acts as a proxy for the Google Gemini API.

Both components are containerized using Docker for consistent deployment across different environments.

## Prerequisites

Before you begin, ensure you have the following installed:
*   [Docker](https://docs.docker.com/get-docker/)
*   [Docker Compose](https://docs.docker.com/compose/install/)

## 1. Building Docker Images

Navigate to the root directory of the project (`WebApp/`) in your terminal.

### Build Frontend Image

```bash
docker build -t data-storyteller-frontend -f Dockerfile .
```

### Build Backend Image

Navigate into the `backend/` directory:

```bash
cd backend
docker build -t data-storyteller-backend -f Dockerfile .
cd .. # Go back to the root directory
```

## 2. Running with Docker Compose

Docker Compose allows you to define and run multi-container Docker applications. Create a file named `docker-compose.yml` in the root directory of your project (`WebApp/`) with the following content:

```yaml
version: '3.8'

services:
  frontend:
    container_name: data-storyteller-frontend
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend

  backend:
    container_name: data-storyteller-backend
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      # IMPORTANT: Replace 'YOUR_GEMINI_API_KEY' with your actual Gemini API Key.
      # This key is loaded securely by the backend proxy and never exposed to the frontend.
      - GEMINI_API_KEY=YOUR_GEMINI_API_KEY
      # Optional: Set a different port for the backend if needed (defaults to 5000)
      - PORT=5000
```

### Environment Variables

*   **`GEMINI_API_KEY` (Required for Backend):** This environment variable must be set for the `backend` service. Replace `YOUR_GEMINI_API_KEY` in the `docker-compose.yml` file with your actual Google Gemini API key. **Do not expose this key directly in your frontend code or public repositories.**
*   **`PORT` (Optional for Backend):** Specifies the port on which the Flask backend will listen. Defaults to `5000` if not set.

### Start the Application

From the root directory of your project, run:

```bash
docker-compose up --build
```

This command will:
*   Build the Docker images (if they haven't been built or if changes are detected).
*   Create and start the `frontend` and `backend` containers.
*   Link the services, allowing the frontend to communicate with the backend via the service name `backend`.

To run in detached mode (in the background):

```bash
docker-compose up --build -d
```

## 3. Accessing the Application

Once the containers are running, open your web browser and navigate to:

```
http://localhost
```

The Nginx frontend will serve the application, and API requests will be proxied to the backend service.

## 4. Stopping the Application

To stop and remove the containers, networks, and volumes created by `docker-compose up`:

```bash
docker-compose down
```
