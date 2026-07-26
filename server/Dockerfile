# ─── Backend ────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY server/package.json ./
RUN npm install --production

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY server/ .
EXPOSE 3001
CMD ["node", "index.js"]
