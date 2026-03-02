FROM node:20-slim

# Install Chrome
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends \
    && wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor > /usr/share/keyrings/google-chrome.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update && apt-get install -y google-chrome-stable --no-install-recommends \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy workspace root and all packages' package.json files first (better caching)
COPY package.json package-lock.json* ./
COPY packages/core/package.json ./packages/core/
COPY packages/ui/package.json ./packages/ui/
COPY packages/mobile/package.json ./packages/mobile/
COPY packages/project/package.json ./packages/project/

# Install dependencies
RUN npm ci --production=false

# Copy the rest of the project
COPY . .

# Create output directories
RUN mkdir -p packages/project/reports packages/project/screenshots packages/project/videos packages/project/logs packages/project/downloads

# Set environment variables for headless execution
ENV HEADLESS=true
ENV BROWSER=chrome
ENV NODE_ENV=test

# Default command (runs the project test via workspace)
CMD ["npm", "run", "test", "--workspace=packages/project"]
