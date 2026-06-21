FROM node:20-alpine as builder

WORKDIR /app

COPY package*.json ./

RUN apk add --no-cache python3 make g++ \
    && npm install

COPY . .

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Install Python here too for runtime
RUN apk add --no-cache python3 \
    && npm ci --only=production

COPY --from=builder /app .

EXPOSE 5000

CMD ["npm", "start"]

