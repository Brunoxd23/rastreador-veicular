# Dockerfile para Next.js (frontend/backend)
FROM node:20-alpine:latest
WORKDIR /app
COPY package*.json ./
RUN npm install --production && npm audit fix
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
