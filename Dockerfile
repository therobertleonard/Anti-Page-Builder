FROM node:18-alpine

# Install OpenSSL to avoid Prisma issues
RUN apk update && apk add --no-cache openssl

# Install bash if required (sometimes useful for debugging or custom commands)
RUN apk add --no-cache bash

# Expose the port your app runs on
EXPOSE 3000

# Set working directory inside the container
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production

# Copy package.json and package-lock.json for installing dependencies
COPY package.json package-lock.json* ./

# Install dependencies and clean npm cache
RUN npm ci --omit=dev && npm cache clean --force

# Remove unnecessary CLI packages
RUN npm remove @shopify/cli

# Copy the rest of the application code into the container
COPY . .

# Set permissions for the app folder, the build folder, and the Sections folder
RUN chown -R node:node /app
RUN chmod -R 755 /app

# Ensure the 'build' folder has the right permissions
RUN chown -R node:node /build
RUN chmod -R 755 /build

# Ensure the 'Sections' folder (if exists) has the right permissions
RUN chown -R node:node /app/Sections
RUN chmod -R 755 /app/Sections

# Set the user to 'node' (non-root user) for security reasons
USER node

# Build the app
RUN npm run build

# Start the app
CMD ["npm", "run", "docker-start"]
