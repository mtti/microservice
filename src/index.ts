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

import fs = require('fs');
import path = require('path');
import winston = require('winston');

export type Configurator = (config: IConfig) => Promise<IConfig>;

export type Initializer = (context: IContext) => Promise<void>;

export interface IConfig {
  [propName: string]: any;
}

export interface IPlugin {
  config?: Configurator;
  init?: Initializer;
}

export interface IContext {
  config: IConfig;
  [propName: string]: any;
}

export class Microservice {
  /** Create a configuration callback which adds all options from an object. */
  private static _createObjectConfigurator(options: IConfig) {
    return async (config: IConfig) => ({ ...config, ...options });
  }

  /** Create a configuration callback which adds a single key-value pair. */
  private static _createPairConfigurator(key: string, value: any) {
    return async (config: IConfig) => ({ ...config, [key]: value });
  }

  public name: string;
  private _configurationCallbacks: Configurator[];
  private _initializationCallbacks: Initializer[];
  private _context: IContext;

  constructor(name: string) {
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
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf((i: any) => `${i.timestamp} ${i.level.toUpperCase()} ${i.message}`),
      ),
      level: this._context.config.env === 'production' ? 'warning' : 'debug',
      levels: winston.config.syslog.levels,
      transports: [
        new winston.transports.Console(),
      ],
    });
  }

  /** Add a plugin. */
  public use(plugin: IPlugin): Microservice {
    if (plugin.config) {
      this.config(plugin.config);
    }
    if (plugin.init) {
      this.init(plugin.init);
    }
    return this;
  }

  /** Add a configurator. */
  public config(key: Configurator | string | IConfig, value?: string): Microservice {
    if (typeof (key) === 'function') {
      this._configurationCallbacks.push(key as Configurator);
    } else if (typeof (key) === 'string') {
      if (value) {
        this.config(Microservice._createPairConfigurator(key, value));
      } else {
        this.config(this._createFileConfigurator(key));
      }
    } else if (key) {
      this.config(Microservice._createObjectConfigurator(key));
    }
    return this;
  }

  /** Add an initializer. */
  public init(cb: Initializer): Microservice {
    this._initializationCallbacks.push(cb);
    return this;
  }

  /** Start the microservice. */
  public async start(): Promise<Microservice> {
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

  /** Create a configuration callback which loads options from a file. */
  private _createFileConfigurator(filename: string): Configurator {
    return async (config: IConfig) => {
      const absolutePath = path.resolve(filename);
      let options;
      if (filename.endsWith('.json')) {
        options = JSON.parse(fs.readFileSync(filename, 'utf8'));
        this._context.log.info(`Loaded JSON configuration from ${absolutePath}`);
      } else {
        throw new Error(`Unrecognized configuration file format (${absolutePath})`);
      }
      return { ...config, ...options };
    };
  }

  /** Execute a single configuration callback. */
  private _executeConfigurator(callback: Configurator): Promise<void> {
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

  private _executeConfigurators(): Promise<void> {
    const reducer = (promise: Promise<void>, callback: Configurator) =>
      promise.then(() => this._executeConfigurator(callback));
    return this._configurationCallbacks.reduce(reducer, Promise.resolve());
  }

  private _executeInitializer(callback: Initializer): Promise<void> {
    const promise = callback(this._context);

    if (!promise.then) {
      throw new Error('Initialization callback must return a promise');
    }

    return promise;
  }

  private _executeInitializers(): Promise<void> {
    const reducer = (promise: Promise<void>, callback: Initializer) =>
      promise.then(() => this._executeInitializer(callback));
    return this._initializationCallbacks.reduce(reducer, Promise.resolve());
  }
}
