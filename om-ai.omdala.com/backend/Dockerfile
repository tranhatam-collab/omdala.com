FROM node:20-alpine AS base
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

EXPOSE 3001
HEALTHCHECK --interval=10s --timeout=3s --retries=10 CMD wget -qO- http://127.0.0.1:3001/ready || exit 1
CMD ["node", "dist/index.js"]
