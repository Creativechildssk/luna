# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
ARG VITE_API_BASE=/api
ENV VITE_API_BASE=$VITE_API_BASE
COPY package*.json ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build

# Serve built static with nginx
FROM nginx:alpine
WORKDIR /usr/share/nginx/html
COPY --from=builder /app/dist ./
COPY infra/nginx-web.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
