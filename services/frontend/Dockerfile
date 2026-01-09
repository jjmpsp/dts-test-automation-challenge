FROM node:20-alpine

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

# Copy all files
COPY . .

ENV PORT=31010
EXPOSE 31010

# Development mode as default
ENV NODE_ENV=development
CMD ["npm", "run", "dev"]
