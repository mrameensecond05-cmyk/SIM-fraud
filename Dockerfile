FROM node:18-buster-slim as build

# Fix for archived Debian Buster repositories
RUN sed -i 's/deb.debian.org/archive.debian.org/g' /etc/apt/sources.list && \
    sed -i 's/security.debian.org/archive.debian.org/g' /etc/apt/sources.list && \
    sed -i '/stretch-updates/d' /etc/apt/sources.list

WORKDIR /app

# Rest of your commands...
RUN sudo apt-get update && sudo apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

RUN npm ci

# 4. Copy the rest of your SIMtinel source code
COPY . .

# 5. Run the build
RUN npm run build 

# Production Stage
FROM nginx:alpine

# Copy from the 'build' stage
COPY --from=build /app/dist /usr/share/nginx/html

# Ensure your custom nginx.conf is in the same directory
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
