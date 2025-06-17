# Use official Node.js LTS Alpine image for smaller size
FROM node:18-alpine

# Set production environment
ENV NODE_ENV=production

# Set working directory inside container
WORKDIR /usr/src/app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs &&     adduser -S nodeuser -u 1001 -G nodejs

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies (production only)
RUN npm ci --only=production && npm cache clean --force

# Copy the rest of your app code
COPY . .

# Change ownership to non-root user
RUN chown -R nodeuser:nodejs /usr/src/app
USER nodeuser

# Expose the port
EXPOSE 3000

# Health check for production monitoring
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3   CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start your Node.js app
CMD [ "node", "server.js" ]
