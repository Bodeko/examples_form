FROM node:18-alpine
EXPOSE 3000

WORKDIR /usr/src/app
COPY . .
RUN npm install

# Set up a default command
CMD [ "npm","start" ]
