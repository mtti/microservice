/*
Copyright 2018 Matti Hiltunen

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
    this.config = { name };
    this.configurationCallbacks = [];
    this.initializationCallbacks = [];

    this.config.env = process.env.NODE_ENV || 'development';

    this.logger = new (winston.Logger)({
      transports: [
        new (winston.transports.Console)({ timestamp: true }),
      ]
    });
    this.logger.setLevels(winston.config.syslog.levels);
    if (this.config.env === 'production') {
      this.logger.level = 'warning';
    } else {
      this.logger.level = 'debug';
    }
  }

  use(plugin) {
    if (plugin.configure) {
      this.configure(plugin.configure);
    }
    if (plugin.init) {
      this.init(plugin.init);
    }
    return this;
  }

  configure(key, value) {
    if (typeof(key) === 'function') {
      this.configurationCallbacks.push(key);
    } else if (typeof(key) === 'string') {
      if (value) {
        this.configurationCallbacks.push(() => {
          this.config[key] = value;
        });
      } else {
        this.configurationCallbacks.push(() => {
          const absolutePath = path.resolve(key);
          let configFile;
          if (key.endsWith('.json')) {
            configFile = JSON.parse(fs.readFileSync(key));
            this.logger.info(`Loaded JSON configuration from ${absolutePath}`);
          } else {
            throw new Error(`Unrecognized configuration file format (${absolutePath})`);
          }
          _.merge(this.config, configFile);
        });
      }
    } else if (key) {
      this.configurationCallbacks.push(() => {
        _.merge(this.config, key);
      });
    }
    return this;
  }

  init(cb) {
    this.initializationCallbacks.push(cb);
    return this;
  }

  start() {
    return this._executeConfigurators()
      .then(() => this._executeInitializers())
      .then(() => {
        this.logger.info('Started');
        return this;
      })
      .catch((err) => {
        this.logger.error(err);
        return Promise.reject(err);
      });
  }

  _executeConfigurators() {
    return new Promise((resolve, reject) => {
      async.each(
        this.configurationCallbacks,
        (cb, done) => {
          const promise = cb(this.config);
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
        this.initializationCallbacks,
        (cb, done) => {
          const promise = cb(this);
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
