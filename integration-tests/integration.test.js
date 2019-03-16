/*
Copyright 2018-2019 Matti Hiltunen

Licensed under the Apache License, Version 2.0 (the 'License');
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an 'AS IS' BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

const { Microservice } = require('../dist');

describe('Microservice integration', () => {
  let service;
  let plugin;
  let configCb;
  let initCb;

  beforeEach(async () => {
    service = new Microservice('test');
    plugin = {
      init: jest.fn(async config => config),
      config: jest.fn(() => Promise.resolve()),
    };
    configCb = jest.fn(async config => config);
    initCb = jest.fn(() => Promise.resolve());

    service.use(plugin);
    service.config(configCb);
    service.init(initCb);
    await service.start();
  });

  it('plugin configurator was called', () => {
    expect(plugin.config).toHaveBeenCalledTimes(1);
  });

  it('plugin initializer was called', () => {
    expect(plugin.init).toHaveBeenCalledTimes(1);
  });

  it('configurator was called', () => {
    expect(configCb).toHaveBeenCalledTimes(1);
  });

  it('initializer was called', () => {
    expect(initCb).toHaveBeenCalledTimes(1);
  });
});
