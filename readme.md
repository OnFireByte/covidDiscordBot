# Covid-19 Discord Bot (Thai)

> Half-work-half-broken Discord bot that run on Discord.js, providing command to check today's covid stat in thailand via DDC's API

## Init Setup

You have to do this on the first time. No need after that

1. install module

```bash
 npm install
```

2. Create ".env" file in root directory

```bash
 touch .env
```

3. In .env file, add this text and your bot's token after that (Do not use whitespace)

```bash
DISCORD_TOKEN=#Your Token Here
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

## Usage

These are available command.

1. Get today data now

```
 /getcovidstat
```

2. Register Daily Data Message

```
 /dailystat True|False
```

> The same message as /getcovidstat but it will automatically send the message at 8 am every day on that channel.
> True to get message, False to don't, False by default.
