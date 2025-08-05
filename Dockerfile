# Step 1: Node.js environment se start karein
FROM node:18-slim

# Step 2: Zaroori dependencies aur LibreOffice install karein
# Yeh command server par poora LibreOffice suite install kar dega
RUN apt-get update && \
    apt-get install -y libreoffice && \
    rm -rf /var/lib/apt/lists/*

# Step 3: Application ke liye ek directory banayein
WORKDIR /usr/src/app

# Step 4: package.json aur package-lock.json ko copy karein
COPY package*.json ./

# Step 5: Node.js packages ko install karein
RUN npm install

# Step 6: Apne project ke baaki code ko copy karein
COPY . .

# Step 7: Application ka port expose karein
EXPOSE 3000

# Step 8: Server ko start karne ke liye command
CMD [ "node", "index.js" ]
