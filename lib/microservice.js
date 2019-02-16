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
const _ = require('lodash');
const async = require('async');
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
        this._configurationCallbacks.push(() => {
          this._context.config[key] = value;
        });
      } else {
        this._configurationCallbacks.push(() => {
          const absolutePath = path.resolve(key);
          let configFile;
          if (key.endsWith('.json')) {
            configFile = JSON.parse(fs.readFileSync(key));
            this._context.log.info(`Loaded JSON configuration from ${absolutePath}`);
          } else {
            throw new Error(`Unrecognized configuration file format (${absolutePath})`);
          }
          _.merge(this._context.config, configFile);
        });
      }
    } else if (key) {
      this._configurationCallbacks.push(() => {
        _.merge(this._context.config, key);
      });
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

  _executeConfigurators() {
    return new Promise((resolve, reject) => {
      async.each(
        this._configurationCallbacks,
        (cb, done) => {
          const promise = cb(this._context.config);
          if (!promise) {
            done();
            return;
          }
          promise.then(() => done()).catch((err) => done(err));
        },
        (err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        }
      )
    });
  }

  _executeInitializers() {
    return new Promise((resolve, reject) => {
      async.each(
        this._initializationCallbacks,
        (cb, done) => {
          const promise = cb(this._context);
          if (!promise) {
            done();
            return;
          }
          promise.then(() => done()).catch((err) => done(err));
        },
        (err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        }
      );
    });
  }
}

module.exports = Microservice;
