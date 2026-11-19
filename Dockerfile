FROM node:22-alpine

WORKDIR /app

COPY package.json ./
COPY server ./server
COPY public ./public

ENV HOST=0.0.0.0
ENV PORT=3840
ENV DATA_DIR=/data

VOLUME ["/data"]
EXPOSE 3840

CMD ["node", "--no-warnings", "server/index.js"]
