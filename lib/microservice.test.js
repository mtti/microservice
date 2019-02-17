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

const Microservice = require('./microservice');

describe('Microservice', () => {
  let service;

  beforeEach(() => {
    service = new Microservice('test-service');
  });

  describe('init()', () => {
    describe('called with a function', () => {
      let callback;

      beforeEach(() => {
        callback = jest.fn();
        service.init(callback);
      });

      test('has one initialization callback', () => {
        expect(service._initializationCallbacks.length).toBe(1);
      });

      test('added the callback', () => {
        expect(service._initializationCallbacks[0]).toBe(callback);
      });

      test('callback was not called', () => {
        expect(callback.mock.calls.length).toBe(0);
      });
    });
  });

  describe('config()', () => {
    describe('called with a function', () => {
      let callback;

      beforeEach(() => {
        callback = jest.fn();
        service.config(callback);
      });

      test('has exactly one configurator', () => {
        expect(service._configurationCallbacks.length).toBe(1);
      });

      test('added callback as configurator', () => {
        expect(service._configurationCallbacks[0]).toBe(callback);
      });

      test('callback was not called', () => {
        expect(callback.mock.calls.length).toBe(0);
      });
    });

    describe('called with a string', () => {


    });

    describe('called with an object', () => {


    });
  });

  describe('use()', () => {


  });

  describe('_executeConfigurators()', () => {
    let callbacks;
    let error;
    let oldConfig;

    beforeEach(() => {
      error = null;

      const createConfigurator = (result) => {
        return config => ({ ...config, ...result });
      };
      callbacks = [
        jest.fn(createConfigurator({ first: 'firstValue' })),
        jest.fn(createConfigurator({ second: 'secondValue' })),
        jest.fn(createConfigurator({ third: 'thirdValue', second: 'overriddenValue' })),
      ];
    });

    describe('when all configurators resolve correctly', () => {
      beforeEach(() => {
        callbacks.forEach(callback => service.config(callback));
        return service._executeConfigurators();
      });

      test('each configurator was called once', () => {
        callbacks.forEach(callback => expect(callback.mock.calls.length).toBe(1));
      });

      test('env option was set to "test"', () => {
        expect(service._context.config.env).toEqual('test');
      });

      test('first option has its initial value', () => {
        expect(service._context.config.first).toEqual('firstValue');
      });

      test('second option has an overridden value', () => {
        expect(service._context.config.second).toEqual('overriddenValue');
      });

      test('third option has its initial value', () => {
        expect(service._context.config.third).toEqual('thirdValue');
      });
    });

    describe('when one configurator throws an error', () => {
      beforeEach(() => {
        callbacks[1] = jest.fn(() => {
          throw new Error('Test error');
        });
      });

      beforeEach(async () => {
        callbacks.forEach(callback => service.config(callback));
        try {
          await service._executeConfigurators();
        } catch (err) {
          error = err;
        }
      });

      test('throws an error', () => {
        expect(error).toBeTruthy();
      });

      test('does not call the last configurator', () => {
        expect(callbacks[2].mock.calls.length).toBe(0);
      });
    });
  });

  describe('_executeInitializers()', () => {
    let callbacks;

    beforeEach(() => {
      callbacks = [
        jest.fn(),
        jest.fn(),
        jest.fn(),
      ];
      callbacks.forEach(callback => service.init(callback));
    });

    beforeEach(() => service._executeInitializers());

    test('each initializer was called once', () => {
      callbacks.forEach(callback => expect(callback.mock.calls.length).toBe(1));
    });
  });
});
