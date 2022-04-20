From node:17.9-slim
WORKDIR /app
COPY package.json /app
RUN npm install
COPY . /app
CMD npm install chartjs-node-canvas ; npm start