FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY src ./src
ENV PORT=51010
EXPOSE 51010
CMD ["node", "src/server.js"]
