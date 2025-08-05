# Use an official Node.js runtime as a parent image
FROM node:18

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package.json package-lock.json ./

# Install any needed packages
RUN npm install

# Copy the rest of the application code
COPY . .

# Make the saved_games directory
RUN mkdir -p saved_games

# Make port 4000 available to the world outside this container
EXPOSE 4000

# Define the command to run your app
CMD [ "node", "app.js" ]
