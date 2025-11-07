# syntax=docker/dockerfile:1

FROM node:20-bookworm

WORKDIR /workspace

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run compile

CMD ["npm", "test"]
