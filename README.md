[![npm version](https://badge.fury.io/js/%40mtti%2Fmicroservice.svg)](https://badge.fury.io/js/%40mtti%2Fmicroservice)

Simple microservice framework designed to reduce the amount of boilerplate required when creating several similar Node.js daemons. This is accomplished by establishing some simple conventions on how different components of an application are configured and initialized. This allows commonly shared components (connections to databases, message queues etc.) to be implemented as reusable plugin modules.

## Installation

```
npm install @mtti/microservice
```

## Usage example

As a summary, you create a new `Microservice` instance and call its `.use()`, `.config()` and `.init()` methods to add plugins, configuration options and initialization callbacks, respectively. Configuration options can be provided as a string path to a JSON file, a one-off key and value, an object with multiple options at once or a callback which receives the service's existing configuration as a parameter. You can also call `.use()` which takes a plugin. More about plugins further down.

```JavaScript
// app.js

const Microservice = require('@mtti/microservice');
const natsPlugin = require('@mtti/microservice-nats');
const ActualService = require('./service');

new Microservice('my-microservice')
  .use(natsPlugin)
  .config((config) => {
    if (process.env.SOME_ENV) {
      return {
          ...config,
          someOption: process.env.SOME_ENV,
      };
    } else {
      throw new Error('SOME_ENV not set');
    }
  })
  .init(({ natsClient }) => {
    const actualService = new ActualService(natsClient);
    actualService.start();
  })
  .start()
    .catch((err) => {
        process.exit(1);
    });
```

The `Microservice` class has four methods of interest:
* `init()` adds an *initializer*, a function callback which gets executed when the microservice starts.
* `config()` adds a *configurator*, a function which sets up configuration options used by the plugin's initializer. They get executed before any initializers. Configurators receive an object containing the service's configuration options and should return a modified copy of it.
* `use()` adds a *plugin*, usually an imported module containing both a configurator and an initializer.
* `start()` starts the microservice, returning a promise. First, all configurators and then all initializers are executed in the order they were added. After they've all run, the promise is resolved.

A configurator can be:

* a function, in which case it will be executed and is passed the `config` object as a parameter and must return a modified copy of it if changes are made.
* a string, which is assumed to be the path to a JSON file which will be loaded and merged into the `config` object
* an object, which will be merged into the `config` object.

Initializers are run in the order they were added after all initializers have run. They can only be functions and should be used to initialize parts of the service, like open connections to databases, message queues, that sort of thing.

Both initializers and configurator functions can work asynchronously by returning a promise.

## Plugins

The `use()` method expects a plugin object. A plugin object is a regular JavaScript object which can contain a configurator and an initializer, as members named `config` and `init`. Both are optional. Any other keys will be ignored right now, but you should consider them reserved.

In practice, a plugin module might look something like this:

```JavaScript
// plugin.js

module.exports = {
    config: (config) => {
        // add code here
    },
    init: (context) => {
        // add code here too
    },
};
```

## License

Released under the Apache License, version 2.0.
