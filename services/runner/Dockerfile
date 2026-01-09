FROM node:20-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends     chromium chromium-driver ca-certificates fonts-liberation     && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY src ./src
ENV PORT=42010
EXPOSE 42010
CMD ["node", "src/server.js"]
