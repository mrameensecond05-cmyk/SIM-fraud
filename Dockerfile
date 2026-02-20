FROM node:18-buster-slim as build

# Fix for archived Debian Buster repositories
WORKDIR /app

# Rest of your commands...

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
