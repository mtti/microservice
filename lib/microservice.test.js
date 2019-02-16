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
});
