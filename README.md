[![npm version](https://badge.fury.io/js/%40mtti%2Fmicroservice.svg)](https://badge.fury.io/js/%40mtti%2Fmicroservice) [![Build Status](https://travis-ci.org/mtti/node-microservice.svg?branch=master)](https://travis-ci.org/mtti/node-microservice)

Opinionated microframework for backend TypeScript applications. In early stages of development.

This project is the core of my *microservice suite*, consisting of:
* [@mtti/apiserver]() RESTful JSON API library
* [@mtti/configs]() application configuration management library
* [@mtti/deps]() an AngularJS style dependency injection container

## Installation

```
npm install --save @mtti/microservice
```

## Usage example

Documentation and the API itself are a work in progress, but here are some examples.

The absolutely minimal, not very useful example:

```typescript
import { start } from '@mtti/microservice';

// Main function

async function main(): Promise<void> {
    // Do something here
}

// Start the application

start(main);

```

You can make it more useful by loading configuration options:

```typescript
import { Configs, getConfigs } from '@mtti/configs';
import { start } from '@mtti/microservice';

// Define configuration options

const configs = new Configs();

configs.define('redisUrl')
  .type(String)
  .default('redis://localhost:6379/0')
  .env('REDIS_URL');

// Main function

type AppConfigs = {
    redisUrl: string;
};

async function main(configs: AppConfigs): Promise<void> {
  console.log(configs.redisUrl);
}
injectFunction([getConfigs(['redisUrl'])], main);

// Start the application

start(main, configs);

```

You can instead use the `redisUrl` configuration option to create a Redis client which can then be injected to the `main()` function.

```typescript
import Redis = require('ioredis');
import winston from 'winston';
import { Configs, getConfigs } from '@mtti/configs';
import { start, logger as loggerType } from '@mtti/microservice';

// Define configuration options

const configs = new Configs();

configs.define('redisUrl')
  .type(String)
  .default('redis://localhost:6379/0')
  .env('REDIS_URL');

// Redis connection

type RedisConfigs = {
    redisUrl: string;
};

async function connectToRedis({ redisUrl }: RedisConfigs, logger: winston.Logger): Promise<Redis.Redis> {
    const redisCl = new Redis(redisUrl, {
      lazyConnect: true,
    });

    redisCl.on('connect', () => {
      logger.info('Redis connected');
    });

    redisCl.on('error', (err: Error) => {
      logger.info(`Redis error: ${err}`);
    });

    await redisCl.connect();

    return redisCl;
}
injectFunction([getConfigs(['redisUrl']), loggerType], connectToRedis);

// Main function

async function main(redisClient: Redis.Redis): Promise<void> {
  // Do something with redisClient
}
injectFunction([connectToRedis], main);

// Start the application

start(main, configs);

```

## License

Released under the Apache License, version 2.0.
