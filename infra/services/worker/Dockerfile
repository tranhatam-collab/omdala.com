# OMDALA Worker (P6)
# Background job processor with BullMQ

FROM node:22-alpine AS base
WORKDIR /app

# Dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Source
COPY src/ ./src/

# Non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"

CMD ["node", "src/index.js"]
