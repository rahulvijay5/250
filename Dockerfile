# Multi-stage Dockerfile for Next.js + Prisma app

FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:18-alpine AS builder
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma client at build time
RUN npx prisma generate
# Build Next.js
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3005

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy needed files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY scripts/docker-entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh
USER appuser

EXPOSE 3005
ENTRYPOINT ["/entrypoint.sh"]
CMD ["npm", "run", "start", "-", "-p", "3005"]


