# Step 1: Ek complete base image se start karein jo build tools ke saath aata hai
FROM node:18-bookworm

# Step 2: Zaroori dependencies, POORA LibreOffice suite, Fonts, aur Ghostscript install karein
# noninteractive flag se user input nahi maangega
ENV DEBIAN_FRONTEND=noninteractive

# Is baar hum LibreOffice ke saare zaroori packages (writer, impress, calc) install kar rahe hain
# taaki har tarah ka conversion kaam kare
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libreoffice \
    libreoffice-writer \
    libreoffice-impress \
    libreoffice-calc \
    libreoffice-pdfimport \
    ghostscript \
    fonts-liberation \
    fonts-croscore \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Step 3: Fonts ke liye ek naya folder banayein
WORKDIR /usr/src/app
RUN mkdir -p /usr/share/fonts/truetype/custom

# Step 4: Apne project ke fonts folder se fonts ko container mein copy karein
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
