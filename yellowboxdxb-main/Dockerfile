# Yellow Box Fleet Management - Production Dockerfile

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Clean install to avoid npm optional dependencies bug
# Remove package-lock.json and clear cache before installing
RUN rm -f package-lock.json && \
    npm cache clean --force && \
    npm install --legacy-peer-deps --no-package-lock

# Copy source code
COPY . .

# Build application (use build:production to skip redundant npm install)
RUN npm run build:production

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install serve to run the static site
RUN npm install -g serve

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Expose port 3000
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application with serve
CMD ["serve", "-s", "dist", "-l", "3000", "--no-clipboard"]
