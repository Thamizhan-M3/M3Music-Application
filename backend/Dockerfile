FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN apk add --no-cache python3 make g++ \
    && ln -sf /usr/bin/python3 /usr/bin/python \
    && npm ci

COPY . .

FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

RUN apk add --no-cache python3 \
    && ln -sf /usr/bin/python3 /usr/bin/python \
    && npm ci --omit=dev \
    && npm cache clean --force

COPY --from=builder --chown=node:node /app/src ./src
COPY --from=builder --chown=node:node /app/scripts ./scripts

USER node

EXPOSE 10000

CMD ["npm", "start"]

