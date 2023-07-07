FROM node:18-alpine

# Create app directory
RUN mkdir -p /usr/src/upload
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install --prod

EXPOSE 3000
CMD [ "npm", "start" ]
