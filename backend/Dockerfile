FROM node:20-slim

# Install OS deps required by Prisma
RUN apt-get update && apt-get install -y openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install

# Copy prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy rest of the app
COPY . .

EXPOSE 3000

# Command is overridden by docker-compose
CMD ["npm", "run", "dev"]