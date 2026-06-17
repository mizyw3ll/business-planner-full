# Dockerfile for Vite React app on port 3000

FROM node:20-alpine

WORKDIR /app

# Accept build arguments
ARG API_URL
ARG ALLOWED_HOSTS=localhost
ENV API_URL=${API_URL}
ENV ALLOWED_HOSTS=${ALLOWED_HOSTS}

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Start Vite preview server on port 3000
CMD ["npm", "run", "preview", "--", "--port", "3000", "--host", "0.0.0.0"]
