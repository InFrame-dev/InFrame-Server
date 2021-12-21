
#FROM node:16-alpine
#WORKDIR /usr/src/app
#COPY ["package.json", "package-lock.json*", "./"]
#RUN npm install http-errors
#RUN npm install
#COPY . .
#EXPOSE 3000
#CMD [ "node", "app.js" ]


FROM node:16.3.0
ENV NODE_ENV=production

WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install --production

COPY . .
EXPOSE 3000

CMD [ "node", "app.js" ]