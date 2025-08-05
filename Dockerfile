# Step 1: Use Node.js slim image
FROM node:18-slim

# Step 2: Set environment to noninteractive to avoid prompts
ENV DEBIAN_FRONTEND=noninteractive

# Step 3: Install dependencies and fonts
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libreoffice \
    fonts-liberation \
    fonts-noto \
    fonts-dejavu \
    fonts-freefont-ttf \
    && rm -rf /var/lib/apt/lists/*

# ttf-mscorefonts-installer is excluded to avoid EULA prompt breaking the build

# Step 4: Create app directory
WORKDIR /usr/src/app

# Step 5: Copy package.json files
COPY package*.json ./

# Step 6: Install Node dependencies
RUN npm install

# Step 7: Copy the rest of the application code
COPY . .

# Step 8: Expose the app port
EXPOSE 3000

# Step 9: Start the server
CMD [ "node", "server.js" ]
