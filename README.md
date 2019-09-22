[![npm version](https://badge.fury.io/js/%40mtti%2Fmicroservice.svg)](https://badge.fury.io/js/%40mtti%2Fmicroservice) [![Build Status](https://travis-ci.org/mtti/node-microservice.svg?branch=master)](https://travis-ci.org/mtti/node-microservice)

This project began as a small framework for creating microservices, but has over time been optimized down to contain a couple of snippets of boilerplate code I tend to use in most of my TypeScript backend projects. Current functionality consists of:

* Setting up [winston](https://www.npmjs.com/package/winston) with my preferred settings.
* Logging unhandled rejections and exiting the process afterwards.
* Receiving a [@mtti/configs](https://github.com/mtti/configs) instance and loading configuration options from the process environment.

...and that's it. Some of the functionality this project used to have, and some more, has been moved to its sibling packages:

* [@mtti/configs](https://github.com/mtti/configs) for configuration managment.
* [@mtti/funcs](https://github.com/mtti/funcs) for utility functions.
* [@mtti/apiserver](https://github.com/mtti/configs) for RESTful JSON APIs.

## License

Released under the Apache License, version 2.0.
