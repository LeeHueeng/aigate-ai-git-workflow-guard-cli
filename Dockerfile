FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache git

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY README.md LICENSE ./

ENTRYPOINT ["node", "/app/src/cli.mjs"]
CMD ["check"]
