# Use the official Node.js image
FROM node:20

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --force 

# Install Nest CLI globally
RUN npm install -g @nestjs/cli

# Copy the rest of the application code
COPY . .

# Install nodemon for live reloading during development
RUN npm install --save-dev nodemon

# Expose the application port (usually 3000 for NestJS)
EXPOSE 7000

# Start the application with the development command
CMD ["npm", "run", "start:dev"]


# # Use the official Node.js image
# FROM node:20

# # Set the working directory
# WORKDIR /usr/src/app

# # Copy package.json and package-lock.json
# COPY package*.json ./

# # Install dependencies
# RUN npm install

# # Install Nest CLI globally
# RUN npm install -g @nestjs/cli

# # Copy the rest of the application code
# COPY . .

# # Build the application
# RUN npm run build

# # Set the command to start the application
# CMD ["node", "dist/main"]