# Build Stage
FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./
# Explicitly install all dependencies, including devDependencies like Vite
RUN npm install --include=dev 

COPY . .
# This will now find 'vite' in node_modules/.bin/
RUN npm run build 

# Production Stage
FROM nginx:alpine

# Ensure you are copying from the 'build' alias defined above
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
