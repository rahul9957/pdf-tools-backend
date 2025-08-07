# Step 1: Ek zyada complete base image se start karein jo build tools ke saath aata hai
FROM node:18-bookworm

# Step 2: Zaroori dependencies, LibreOffice, Fonts, aur Ghostscript install karein
# noninteractive flag se user input nahi maangega
ENV DEBIAN_FRONTEND=noninteractive

# Is baar hum 'contrib' section add kar rahe hain taaki zaroori packages mil sakein
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libreoffice \
    ghostscript \
    fonts-liberation \
    fonts-noto-core \
    # Yeh Microsoft fonts ka ek behtar alternative hai jo EULA nahi maangta
    fonts-croscore \
    && rm -rf /var/lib/apt/lists/*

# Step 3: Application ke liye ek directory banayein
WORKDIR /usr/src/app

# Step 4: package.json aur package-lock.json ko copy karein
# Sirf package.json copy karna better practice hai taaki cache ka aache se istemal ho
COPY package.json ./

# Step 5: Node.js packages ko install karein
RUN npm install

# Step 6: Apne project ke baaki code ko copy karein
COPY . .

# Step 7: Application ka port expose karein
EXPOSE 3000

# Step 8: Server ko start karne ke liye command
CMD [ "node", "server.js" ]
