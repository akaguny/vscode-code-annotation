# syntax=docker/dockerfile:1

FROM node:24-bookworm

WORKDIR /workspace

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run compile

CMD ["npm", "test"]
