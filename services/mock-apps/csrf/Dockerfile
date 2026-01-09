FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY src ./src
ENV PORT=51011
EXPOSE 51011
CMD ["node", "src/server.js"]
