From node:17.9-alpine
WORKDIR /app
COPY package.json /app

ARG TARGETPLATFORM
RUN if [ "$TARGETPLATFORM" = "linux/arm64" ]; \
    then apk add --no-cache \
    build-base \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev;\ 
    fi

Run npm install

COPY . /app

CMD npm install chartjs-node-canvas ;\ 
    npm start