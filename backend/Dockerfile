FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (better-sqlite3 compiles using python3 and build-base on alpine if needed)
RUN apk add --no-cache python3 make g++ gcc
RUN npm install

# Copy source files
COPY . .

# Build TypeScript and seed initial database
RUN npm run build
RUN npm run seed

EXPOSE 5000

CMD ["npm", "start"]
