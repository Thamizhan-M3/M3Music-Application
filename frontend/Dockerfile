# ---------- Stage 1: Build ----------
FROM node:20 AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build


# ---------- Stage 2: Serve ----------
FROM nginxinc/nginx-unprivileged:stable-alpine

USER root
RUN apk update && apk upgrade --no-cache \
    && apk add --no-cache gettext \
    && chown -R nginx:nginx /usr/share/nginx/html /etc/nginx/conf.d
USER 101

# Copy built app
COPY --from=build --chown=nginx:nginx /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY --chown=nginx:nginx nginx.conf /etc/nginx/conf.d/default.conf

# Runtime env injection template
COPY --chown=nginx:nginx env.template.js /usr/share/nginx/html/env.template.js

EXPOSE 8080

CMD ["/bin/sh", "-c", "envsubst < /usr/share/nginx/html/env.template.js > /usr/share/nginx/html/env.js && nginx -g 'daemon off;'"]
