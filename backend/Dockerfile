# Base image
FROM node:20-alpine AS build

# Install ffmpeg for RTSP proxying if needed by any camera modules
RUN apk add --no-cache ffmpeg

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the NestJS app
RUN npm run build

# Production image
FROM node:20-alpine AS production

# Install ffmpeg in production image as well
RUN apk add --no-cache ffmpeg

WORKDIR /app

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy generated Prisma client
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma

# Copy built app
COPY --from=build /app/dist ./dist

# Expose port (default NestJS port is 3333 in this project based on api.ts)
EXPOSE 3333

# Start the application
CMD [ "node", "dist/main.js" ]
