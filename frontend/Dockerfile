FROM node:16.1

RUN mkdir /usr/app && chown -R node:node /usr/app/
WORKDIR /usr/app

USER node
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci && npm cache clean --force
COPY --chown=node:node tsconfig.json ./

ENV NODE_ENV=development
RUN npm install --only=development
ENV PATH /usr/app/node_modules/.bin:$PATH
CMD ["npm", "start"]