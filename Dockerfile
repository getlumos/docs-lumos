# Stage 1: Build the Astro site
FROM node:25-alpine AS builder

# Build arguments for deployment info
ARG DEPLOY_BRANCH=unknown
ARG DEPLOY_COMMIT=unknown
ARG DEPLOY_TIME=unknown

# Set environment variables for Astro build
ENV PUBLIC_DEPLOY_BRANCH=$DEPLOY_BRANCH
ENV PUBLIC_DEPLOY_COMMIT=$DEPLOY_COMMIT
ENV PUBLIC_DEPLOY_TIME=$DEPLOY_TIME

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build the site (env vars will be inlined during build)
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration (if needed)
# COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
