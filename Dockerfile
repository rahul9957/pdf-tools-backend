# Step 1: Ek complete base image se start karein jo build tools ke saath aata hai
FROM node:18-bookworm

# Step 2: Zaroori dependencies, LibreOffice, Fonts, aur Ghostscript install karein
# noninteractive flag se user input nahi maangega
ENV DEBIAN_FRONTEND=noninteractive

# Is baar hum sirf zaroori packages install kar rahe hain jo conflict nahi karte
# 'unzip' font installation ke liye zaroori ho sakta hai
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libreoffice \
    ghostscript \
    unzip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Step 3: Application ke liye ek directory banayein
WORKDIR /usr/src/app

# Step 4: Fonts ke liye ek naya folder banayein aur fonts copy karein
# Yeh step aapke custom fonts (Arial, etc.) ko install karega
RUN mkdir -p /usr/share/fonts/truetype/custom
COPY fonts/ /usr/share/fonts/truetype/custom/

# Step 5: System ka font cache update karein taaki LibreOffice fonts ko dhoondh sake
RUN fc-cache -f -v

# Step 6: package.json ko copy karke packages install karein
COPY package.json ./
RUN npm install

# Step 7: Apne project ke baaki code ko copy karein
COPY . .

# Step 8: Application ka port expose karein
EXPOSE 3000

# Step 9: Server ko start karne ke liye command
CMD [ "node", "server.js" ]
