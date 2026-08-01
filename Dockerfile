FROM node:26-alpine

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install ALL dependencies (including devDependencies needed for build)
RUN npm ci

# Copy application source code
COPY . .

# Compile TypeScript to JavaScript (dist/server.js)
RUN npm run build

# Expose internal port
EXPOSE 3500

# Start compiled JS in production
CMD npx tsx src/core/database/seed.ts && npm start
