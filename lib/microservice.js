/*
Copyright 2018-2019 Matti Hiltunen

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

const fs = require('fs');
const path = require('path');
const winston = require('winston');

class Microservice {
  constructor(name) {
    this.name = name;
    this._configurationCallbacks = [];
    this._initializationCallbacks = [];
    this._context = {
      config: {
        env: process.env.NODE_ENV || 'development',
      },
      service: this,
    };

    this._context.log = winston.createLogger({
      levels: winston.config.syslog.levels,
      level: this._context.config.env === 'production' ? 'warning' : 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(i => `${i.timestamp} ${i.level.toUpperCase()} ${i.message}`)
      ),
      transports: [
        new winston.transports.Console(),
      ],
    });
  }

  /** Add a plugin. */
  use(plugin) {
    if (plugin.config) {
      this.config(plugin.config);
    }
    if (plugin.init) {
      this.init(plugin.init);
    }
    return this;
  }

  /** Add a configurator. */
  config(key, value) {
    if (typeof(key) === 'function') {
      this._configurationCallbacks.push(key);
    } else if (typeof(key) === 'string') {
      if (value) {
        this.config(this._createPairConfigurator(key, value));
      } else {
        this.config(this._createFileConfigurator(key));
      }
    } else if (key) {
      this.config(this._createObjectConfigurator(key));
    }
    return this;
  }

  /** Add an initializer. */
  init(cb) {
    this._initializationCallbacks.push(cb);
    return this;
  }

  /** Start the microservice. */
  async start() {
    try {
      await this._executeConfigurators();
      await this._executeInitializers();
      this._context.log.info('Started');
      return this;
    } catch (err) {
      this._context.log.error(err);
      throw err;
    }
  }

  /** Create a configuration callback which adds a single key-value pair. */
  _createPairConfigurator(key, value) {
    return async config => ({ ...config, [key]: value });
  }

  /** Create a configuration callback which loads options from a file. */
  _createFileConfigurator(filename) {
    return async (config) => {
      const absolutePath = path.resolve(key);
      let options;
      if (key.endsWith('.json')) {
        options = JSON.parse(fs.readFileSync(key));
        this._context.log.info(`Loaded JSON configuration from ${absolutePath}`);
      } else {
        throw new Error(`Unrecognized configuration file format (${absolutePath})`);
      }
      return { ...config, ...options };
    };
  }

  /** Create a configuration callback which adds all options from an object. */
  _createObjectConfigurator(options) {
    return async config => ({ ...config, ...options });
  }

  /** Execute a single configuration callback. */
  _executeConfigurator(callback) {
    const config = { ...this._context.config };
    const promise = callback(config);

    if (!promise.then) {
      throw new Error('Configuration callback must return a promise');
    }

    return promise.then((result) => {
      if (result !== config) {
        this._context.config = result;
      }
    });
  }

  _executeConfigurators() {
    const reducer = (promise, callback) => {
      return promise.then(() => this._executeConfigurator(callback));
    };
    return this._configurationCallbacks.reduce(reducer, Promise.resolve());
  }

  _executeInitializer(callback) {
    const promise = callback(this._context);

    if (!promise.then) {
      throw new Error('Initialization callback must return a promise');
    }

    return promise;
  }

  _executeInitializers() {
    const reducer = (promise, callback) => {
      return promise.then(() => this._executeInitializer(callback));
    };
    return this._initializationCallbacks.reduce(reducer, Promise.resolve());
  }
}

module.exports = Microservice;
