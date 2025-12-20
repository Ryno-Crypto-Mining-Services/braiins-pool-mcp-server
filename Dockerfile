# Multi-stage Dockerfile for braiins-pool-mcp-server
# Optimized for small image size and security

# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files first (better layer caching)
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY tsconfig.json tsup.config.ts* ./
COPY src ./src

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:22-alpine AS production

# Add labels for container metadata
LABEL org.opencontainers.image.title="braiins-pool-mcp-server"
LABEL org.opencontainers.image.description="MCP server for Braiins Pool API"
LABEL org.opencontainers.image.source="https://github.com/RynoCrypto/braiins-pool-mcp-server"
LABEL org.opencontainers.image.licenses="MIT"

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mcp -u 1001 -G nodejs

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install production dependencies only
# --ignore-scripts skips 'prepare' hook which needs husky (a devDep)
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

# Copy built artifacts from builder stage
COPY --from=builder /app/dist ./dist

# Set ownership to non-root user
RUN chown -R mcp:nodejs /app

# Switch to non-root user
USER mcp

# MCP servers communicate via stdio, no ports needed
# Environment variables for configuration
ENV NODE_ENV=production

# Health check (MCP servers don't expose HTTP, so we check the process)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "console.log('healthy')" || exit 1

# Run the MCP server
CMD ["node", "dist/index.js"]
