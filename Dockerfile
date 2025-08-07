FROM python:3.11-slim

ENV DEBIAN_FRONTEND=noninteractive

# Install system packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libreoffice \
        fonts-liberation \
        fonts-noto \
        fonts-dejavu \
        curl \
        unzip \
        && rm -rf /var/lib/apt/lists/*

# Create fonts directory
RUN mkdir -p /usr/share/fonts/truetype/custom

# Copy custom fonts into the image
COPY fonts/*.ttf /usr/share/fonts/truetype/custom/

# Rebuild font cache
RUN fc-cache -f -v

# Copy app files and install dependencies
WORKDIR /app
COPY . /app
RUN pip install --no-cache-dir -r requirements.txt

CMD ["python", "main.py"]
