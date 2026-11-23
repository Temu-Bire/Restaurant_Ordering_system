# ==========================================
# Arif Food Restaurant Backend Dockerfile
# Multi-stage production build
# ==========================================

# 1. Build Stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy dependency files
COPY package*.json .npmrc* ./
COPY prisma ./prisma/
COPY prisma7.config.ts* ./

# Install all dependencies (including devDependencies for build)
RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Copy source code and config
COPY . .

# Build production distribution
RUN npm run build

# 2. Production Runtime Stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install runtime utilities
RUN apk add --no-cache openssl

# Copy package manifests and production dependencies
COPY package*.json .npmrc* ./
RUN npm install --omit=dev && npm cache clean --force

# Copy Prisma schema and generated client from builder
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy built application output
COPY --from=builder /app/dist ./dist

# Create uploads directory
RUN mkdir -p /app/uploads/menu /app/uploads/avatars

# Expose HTTP port
EXPOSE 3000

# Start production server
CMD ["node", "dist/src/main.js"]
