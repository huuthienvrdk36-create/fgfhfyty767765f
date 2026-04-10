# Backend Dockerfile (NestJS)
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile --production=false

# Copy source code
COPY . .

# Build TypeScript
RUN yarn build

# Remove dev dependencies
RUN yarn install --frozen-lockfile --production

EXPOSE 3001

CMD ["node", "dist/main.js"]
