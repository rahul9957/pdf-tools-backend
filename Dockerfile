# Step 1: Node.js environment se start karein
FROM node:18-slim

# Step 2: Zaroori dependencies, LibreOffice, Fonts, aur Ghostscript install karein
# noninteractive flag se user input nahi maangega
ENV DEBIAN_FRONTEND=noninteractive

# YEH NAYI LINE ERROR KO FIX KARTI HAI
# Microsoft fonts ke EULA ko pehle se hi accept kar lein
RUN echo "ttf-mscorefonts-installer msttcorefonts/accepted-mscorefonts-eula select true" | debconf-set-selections

# Ab installation command bina ruke chalegi
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libreoffice \
    ghostscript \
    fonts-liberation \
    fonts-noto \
    ttf-mscorefonts-installer \
    && rm -rf /var/lib/apt/lists/*

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
CMD [ "node", "server.js" ]
