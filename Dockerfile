# 1. Switch to 'buster-slim' for better compatibility with older host OS (Ubuntu 18.04)
FROM node:18-buster-slim as build

WORKDIR /app

# 2. Copy package files
COPY package*.json ./

# 3. Use 'npm ci' (Clean Install). 
# It is faster and more reliable for Docker builds than 'npm install'
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

RUN npm ci

# 4. Copy the rest of your SIMtinel source code
COPY . .

# 5. Run the build (now Vite will be found)
RUN npm run build 

# Production Stage
FROM nginx:alpine

# Copy from the 'build' stage
COPY --from=build /app/dist /usr/share/nginx/html

# Ensure your custom nginx.conf is in the same directory as this Dockerfile
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
