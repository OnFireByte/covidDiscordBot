ARG TARGETPLATFORM
From --platform=$TARGETPLATFORM node:17.9-slim
WORKDIR /app
COPY package.json /app
RUN if ["$TARGETPLATFORM" = "linux/arm64"] ; \
    then sudo apt-get update ;\
        sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev;\
        npm install canvas;\ 
    fi 
RUN npm install

COPY . /app

CMD npm install chartjs-node-canvas ;\ 
    npm start