FROM node:22.19-alpine

WORKDIR /app/projects/DigitalTwinsBackend

RUN npm install --global --force yarn

RUN corepack enable

RUN yarn set version 1.22.22

RUN yarn global add nodemon

COPY . .

EXPOSE 3000