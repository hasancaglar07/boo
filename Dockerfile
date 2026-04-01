# Multi-stage build for Next.js web app
FROM node:20-alpine AS web-builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy web app files
COPY web/package.json web/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY web/ ./
RUN pnpm build

# Production stage for web
FROM node:20-alpine AS web

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy built files
COPY --from=web-builder /app/public ./public
COPY --from=web-builder /app/.next/standalone ./
COPY --from=web-builder /app/.next/static ./.next/static

# Expose port
EXPOSE 3000

# Start Next.js
CMD ["node", "server.js"]

# Python dashboard stage
FROM python:3.11-slim AS dashboard

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    bash \
    jq \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy project files
COPY *.sh *.py ./
COPY scripts/ ./scripts/

# Create necessary directories
RUN mkdir -p book_outputs multi_provider_logs

# Expose port
EXPOSE 8765

# Start dashboard server
CMD ["python3", "dashboard_server.py"]
