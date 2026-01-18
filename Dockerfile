FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

ENV NITRO_PORT=3000
ENV NITRO_HOST=0.0.0.0

CMD ["node", ".output/server/index.mjs"]
