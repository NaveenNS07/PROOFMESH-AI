FROM node:22-alpine

WORKDIR /app

COPY package.json bun.lock* ./
RUN npm install

COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "run", "start"]
