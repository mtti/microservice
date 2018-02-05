[![npm version](https://badge.fury.io/js/%40mtti%2Fmicroservice.svg)](https://badge.fury.io/js/%40mtti%2Fmicroservice)

**@mtti/microservice** is a minimalistic, modular microservice framework. Sort of. It has very little to do with microservices directly, it's more of a wrapper for a bunch of boilerplate code (like setting up logging) so I don't have to copy-paste around identical code between different sub-projects.

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

The `Microservice` class has three methods of interest, `use()` which we'll get to in a moment, `configure()` which adds a *configurator* and `init()` which adds an *initializer*.

Configurators add things to the service's `config` object, which is intended for storing all of the service's configuration options. All configurators are run in the order they were added before initializers are run. A configurator can be

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

For a more practical example, look at [@mtti/microservice-nats](https://github.com/mtti/node-microservice-nats), a plugin which creates a [NATS](https://nats.io/) client.

## License

Released under the Apache License, version 2.0.
