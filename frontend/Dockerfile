# ---------- Stage 1: Build ----------
FROM node:20 AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build


# ---------- Stage 2: Serve ----------
FROM nginx:alpine

RUN apk add --no-cache gettext

# Copy built app
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Runtime env injection template
COPY env.template.js /usr/share/nginx/html/env.template.js

EXPOSE 80

CMD ["/bin/sh", "-c", "envsubst < /usr/share/nginx/html/env.template.js > /usr/share/nginx/html/env.js && nginx -g 'daemon off;'"]