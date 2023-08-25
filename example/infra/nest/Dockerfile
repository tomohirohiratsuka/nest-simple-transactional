FROM node:18-alpine AS base

# Install tools
RUN apk add --no-cache bash vim

# copy for symlink
COPY ./ /app

# install for symlink
WORKDIR /app
RUN npm install

# Set working directory for example
WORKDIR /app/example

# Install Nest CLI for example
RUN npm install -g @nestjs/cli
# Install dependencies for example
RUN npm install

# Start nest api server
CMD ["npm", "run", "start:dev"]
