# Multi-stage Dockerfile for Content Creation Platform
# Optimized for production with security and performance best practices

# Build stage
FROM node:18-alpine AS builder

# Build arguments
ARG BUILD_DATE
ARG GIT_COMMIT
ARG VERSION

# Set environment variables
ENV NODE_ENV=production
ENV NPM_CONFIG_LOGLEVEL=warn
ENV NPM_CONFIG_PROGRESS=false

# Create app directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Install dependencies
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# Copy source code
COPY src/ ./src/

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Build arguments
ARG BUILD_DATE
ARG GIT_COMMIT
ARG VERSION

# Labels for metadata
LABEL maintainer="Content Platform Team <team@contentplatform.com>"
LABEL org.opencontainers.image.title="Content Creation Platform"
LABEL org.opencontainers.image.description="AI-powered content creation and competitive intelligence platform"
LABEL org.opencontainers.image.version="${VERSION}"
LABEL org.opencontainers.image.created="${BUILD_DATE}"
LABEL org.opencontainers.image.revision="${GIT_COMMIT}"
LABEL org.opencontainers.image.source="https://github.com/company/content-creation-platform"

# Install security updates and required packages
RUN apk update && \
    apk upgrade && \
    apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force && \
    rm -rf ~/.npm

# Copy built application from builder stage
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Copy additional files
COPY --chown=nestjs:nodejs scripts/ ./scripts/
COPY --chown=nestjs:nodejs public/ ./public/

# Create necessary directories
RUN mkdir -p /app/logs /app/temp && \
    chown -R nestjs:nodejs /app/logs /app/temp

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV BUILD_DATE=${BUILD_DATE}
ENV GIT_COMMIT=${GIT_COMMIT}
ENV VERSION=${VERSION}

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/main.js"]

# Development stage (for local development)
FROM node:18-alpine AS development

# Install development dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    && rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci && \
    npm cache clean --force

# Copy source code
COPY --chown=nestjs:nodejs . .

# Create necessary directories
RUN mkdir -p /app/logs /app/temp && \
    chown -R nestjs:nodejs /app/logs /app/temp

# Switch to non-root user
USER nestjs

# Expose port and debug port
EXPOSE 3000 9229

# Start in development mode with hot reload
CMD ["npm", "run", "start:dev"]

# Testing stage
FROM development AS testing

# Switch back to root for installing test dependencies
USER root

# Install additional testing tools
RUN apk add --no-cache \
    chromium \
    && rm -rf /var/cache/apk/*

# Set Chrome path for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV CHROMIUM_PATH=/usr/bin/chromium-browser

# Switch back to non-root user
USER nestjs

# Run tests
CMD ["npm", "run", "test"]

# Security scanning stage
FROM production AS security-scan

# Switch to root for security scanning
USER root

# Install security scanning tools
RUN apk add --no-cache \
    trivy \
    && rm -rf /var/cache/apk/*

# Run security scan
RUN trivy filesystem --exit-code 1 --no-progress --severity HIGH,CRITICAL /app

# Switch back to non-root user
USER nestjs
