FROM node:22-alpine AS build

WORKDIR /app

COPY server/nestjs/package*.json ./
RUN npm ci

COPY server/nestjs/ ./
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY --from=build --chown=node:node /app/package*.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist

COPY --chown=node:node sito/index/ ./public/
COPY --chown=node:node sito/index/ ./public/index/
COPY --chown=node:node sito/menu/ ./public/menu/
COPY --chown=node:node sito/panino/ ./public/panino/
COPY --chown=node:node sito/admin/ ./public/admin/
COPY --chown=node:node sito/kitchen/ ./public/kitchen/
COPY --chown=node:node images/ ./public/images/
COPY --chown=node:node server/nestjs/public/images/ ./public/images/

RUN mkdir -p /app/public/images/catalog/uploads \
  && chown -R node:node /app/public

USER node

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3000/api >/dev/null || exit 1

CMD ["node", "dist/main"]
