# OMDALA API Gateway (P5)
# Lightweight Node.js 22 Alpine gateway

FROM node:22-alpine AS base
WORKDIR /app

# System deps: aws-cli for R2 health checks
RUN apk add --no-cache aws-cli

# Dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Source
COPY src/ ./src/

# Non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"

CMD ["node", "src/index.js"]
