FROM node:12-slim as base
WORKDIR /code

FROM base AS dependencies
RUN apt-get update && apt-get -y install yarn wget make gnupg gcc g++ python bash --no-install-recommends && rm -rf /var/lib/apt/lists/*
COPY package.json yarn.lock ./
RUN yarn --production

FROM dependencies AS develop
ENV NODE_ENV development
COPY . .
RUN yarn --silent && \
    yarn build

FROM base AS release
ENV NODE_ENV production
COPY package.json yarn.lock ./
COPY --from=dependencies /code/node_modules ./node_modules
COPY --from=develop /code/dist ./dist/
RUN yarn build

CMD ["yarn", "start"]