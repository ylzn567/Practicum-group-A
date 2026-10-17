# שלב 1: בנייה. כולל תלויות פיתוח (tsc, ts-node), ולכן משמש גם להרצת ה-seed
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# שלב 2: הרצה. רק תלויות ייצור והקוד המקומפל, בלי קוד מקור וכלי פיתוח
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
EXPOSE 5000
USER node
CMD ["node", "dist/index.js"]
