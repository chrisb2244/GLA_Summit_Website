FROM node:16.13.0

RUN mkdir /usr/app && chown -R node:node /usr/app/
WORKDIR /usr/app

USER node
COPY --chown=node:node package.json package-lock.json ./
# RUN npm ci && npm cache clean --force
COPY --chown=node:node tsconfig.json next.config.js ./

ENV NODE_ENV=development
RUN npm install
ENV PATH /usr/app/node_modules/.bin:$PATH

COPY --chown=node:node .env.local ./
CMD ["npm", "run", "dev"]