FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY src ./src
ENV PORT=51013
EXPOSE 51013
CMD ["node", "src/server.js"]
