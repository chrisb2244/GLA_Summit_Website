FROM node:18.18.2

RUN mkdir /usr/app && chown -R node:node /usr/app/
WORKDIR /usr/app

USER node
COPY --chown=node:node package.json package-lock.json ./
# RUN npm ci && npm cache clean --force
COPY --chown=node:node tsconfig.json ./

ENV NODE_ENV=development
RUN npm install
ENV PATH /usr/app/node_modules/.bin:$PATH

COPY --chown=node:node next.config.js next-env.d.ts .env.local .env ./
# ENV PLAYWRIGHT 1
COPY --chown=node:node postcss.config.js tailwind.config.js ./
ENV NODE_OPTIONS=--max_old_space_size=3000
CMD ["npm", "run", "dev"]