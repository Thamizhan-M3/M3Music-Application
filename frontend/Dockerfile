FROM node:20 AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build


FROM nginxinc/nginx-unprivileged:stable-alpine

USER root
RUN apk update && apk upgrade --no-cache \
    && apk add --no-cache gettext

COPY --from=build --chown=nginx:nginx /app/dist /usr/share/nginx/html

COPY --chown=nginx:nginx nginx.conf /etc/nginx/conf.d/default.conf

COPY --chown=nginx:nginx env.template.js /usr/share/nginx/html/env.template.js

RUN touch /usr/share/nginx/html/env.js \
    && chown -R nginx:nginx /usr/share/nginx/html /etc/nginx/conf.d /var/cache/nginx /var/run /var/log/nginx /tmp \
    && chmod -R u+rwX /usr/share/nginx/html /etc/nginx/conf.d /var/cache/nginx /var/run /var/log/nginx /tmp

USER 101

EXPOSE 8080

CMD ["/bin/sh", "-c", "envsubst < /usr/share/nginx/html/env.template.js > /usr/share/nginx/html/env.js && nginx -g 'daemon off;'"]
