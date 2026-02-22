FROM node:18-alpine AS builder

WORKDIR /app

COPY client/package*.json ./
RUN npm ci

COPY client/src ./src
COPY client/index.html ./
COPY client/vite.config.js ./

RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["npx", "serve", "-s", "dist", "-l", "3000"]

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/', () => process.exit(0))"
