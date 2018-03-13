[![npm version](https://badge.fury.io/js/%40mtti%2Fmicroservice.svg)](https://badge.fury.io/js/%40mtti%2Fmicroservice)

While creating a number of Node.js microservices for an MVP web app I was building, I noticed I was spending time copy-pasting boilerplate code to each new microservice. Code for things like connecting to a message queue, connecting to databases, initializing database models, that sort of thing.

This felt like a waste of my time, so I created this microframework to help me modularize all the boilerplate code so I could just import it instead of copy-pasting.

## Installation

```
npm install @mtti/microservice
```

## Usage

A fairly typical use case for me would look something like this:

```JavaScript
// app.js

const Microservice = require('@mtti/microservice');
const natsPlugin = require('@mtti/microservice-nats');
const ActualService = require('./service');

new Microservice('my-microservice')
  .use(natsPlugin)
  .configure((config) => {
    if (process.env.SOME_ENV) {
      config.someOption = process.env.SOME_ENV;
    } else {
      throw new Error('SOME_ENV not set');
    }
  })
  .init((service) => {
    const actualService = new ActualService(service.natsClient);
    actualService.start();
  })
  .start()
    .catch((err) => {
        process.exit(1);
    });
```

The `Microservice` class has four methods of interest:
* `init()` adds an *initializer*, a function callback which gets executed when the microservice starts.
* `configure()` adds a *configurator*, a function which sets up configuration options used by the plugin's initializer. Configurators should only modify the `config` field of the service. They get executed before any initializers.
* `user()` adds a *plugin*, usually an imported module containing both a configurator and an initializer.
* `start()` starts the microservice, returning a promise. First, all configurators and then all initializers are executed in the order they were added. After they've all run, the promise is resolved.

A configurator can be:

* a function, in which case it will be executed and is passed the `config` object as a parameter
* a string, which is assumed to be the path to a JSON file which will be loaded and merged into the `config` object
* an object, which will be merged into the `config` object.

Initializers are run in the order they were added after all initializers have run. They can only be functions and should be used to initialize parts of the service, like open connections to databases, message queues, that sort of thing.

Both initializers and configurator functions can work asynchronously by returning a promise.

## Plugins

The `use()` method expects a plugin object. A plugin object is a regular JavaScript object which can contain a configurator and an initializer, as members named `configure` and `init`. Both are optional. Any other keys will be ignored right now, but you should consider them reserved.

In practice, a plugin module might look something like this:

```JavaScript
// plugin.js

module.exports = {
    configure: (config) => {
        // add code here
    },
    init: (service) => {
        // add code here too
    },
};
```

Some plugins I've written:

* [@mtti/microservice-nats](https://github.com/mtti/node-microservice-nats) for connecting to [NATS](https://nats.io/).
* [@mtti/microservice-sequelize](https://github.com/mtti/node-microservice-sequelize) for connecting to a relational database using the Sequelize ORM.
* [@mtti/microservice-redis](https://github.com/mtti/node-microservice-redis) for connecting to Redis.

## License

Released under the Apache License, version 2.0.
