# שלב 1: בניית האתר הסטטי
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# שלב 2: nginx מגיש את האתר, ומעביר /api לבאקאנד (במקום ה-proxy של vite בפיתוח)
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
