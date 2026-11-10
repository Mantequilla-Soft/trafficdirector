# Traffic Director Tests

## Unit tests

`npm test` runs `tests/unit/*.test.js` with Node's built-in test runner. They need no MongoDB or network: axios, the HotNode model and the activity logger are stubbed.

## Integration scripts

The other files here (`npm run test:db`, `test:create`, `test:update`, `test:public`, `test:hotnode`, `add:node`) are manual scripts that talk to a real MongoDB or a running server.
