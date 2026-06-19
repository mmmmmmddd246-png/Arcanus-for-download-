FROM node:20-slim

# Install yt-dlp dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp
RUN pip3 install --break-system-packages --no-cache-dir yt-dlp

# Install Node dependencies
WORKDIR /app
COPY package*.json ./
RUN npm install --production && npm cache clean --force

# Copy app files
COPY . .

# Create downloads directory with proper permissions
RUN mkdir -p downloads && chmod 777 downloads

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

EXPOSE 3000

CMD ["node", "server.js"]
