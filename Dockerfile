FROM node:14-alpine
RUN mkdir /code
ADD package.json yarn.lock /code/
WORKDIR /code
RUN yarn

ADD . /code/
RUN yarn tsc

USER node
CMD yarn start
