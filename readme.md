# Covid-19 Discord Bot (Thai)

***Due to API change, this repo is DEPRECATED and ARCHIVED***

> Half-work-half-broken Discord bot that run on Discord.js, providing command to check today's covid stat in thailand via DDC's API

## Init Setup

You have to do this on the first time. No need after that

1. install module

```bash
 npm install --only=prod
```

2. Create ".env" file in root directory (you can use template from .env.example)

```bash
 cp .env.example .env
```

3. In .env file, change placeholder with your bot's token (Do not use whitespace)

```bash
DISCORD_TOKEN=#YOUR_TOKEN_HERE
```

## How to run

Simply just

```bash
 npm start
```

or

```bash
 node .
```

## Docker Image

### Pull image from Docker hub

```bash
 docker pull byte101/covid-discord-bot-docker
```

### Create and run container

```bash
 docker run -e DISCORD_TOKEN=**YOUR_TOKEN_HERE** byte101/covid-discord-bot-docker
```

## Usage

These are available command.

1. Get today data now

```
 /getcovidstat
```

2. Register daily data message

```
 /dailystat True|False
```

> The same message as /getcovidstat but it will automatically send the message at 8 am every day on that channel.
> True to get message, False to don't, False by default. 3. Get chart of data for previous 30 days

```
 /getchart infect|death|recovered|all
```
