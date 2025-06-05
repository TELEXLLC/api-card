# Use official Node.js LTS image
FROM node:18

# Set working directory inside container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of your app code
COPY . .

# Expose the port
EXPOSE 3000

# Start your Node.js app
CMD [ "node", "server.js" ]