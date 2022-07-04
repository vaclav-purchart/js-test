# js-test
Simple, zero-dependency test framework inspired by mocha and jest.

Test framework which allows to run both synchronous and asynchronous tests and to structure them into test suites.

## Usage
### ES6 modules
```javascript
import { describe, test, assert } from 'js-test'

describe('my test suite', () => {
	test('my async test', async () => {
		const response = await fetch('https://github.com')
		assert.equals(response.status, 200, 'should return HTTP 200 status')
	})
})
```

### CommonJS modules
```javascript
const { describe, test, assert } = require('js-test')

describe('my test suite', () => {
	test('my async test', async () => {
		const response = await fetch('https://github.com')
		assert.equals(response.status, 200, 'should return HTTP 200 status')
	})
})
```

## Test definition API

### Test suite definition
Test suite can be defined with `describe` (alias `suite`).
```javascript
describe(name, handler)
```
- **name** - string - text identifier of the suite

- **handler** - function - sync or async function to init/define the test suite

### Test case definition
Test case can be defined with `test` (alias `it`).
```javascript
test(name, handler)
```
- **name** - string - text identifier of the suite

- **handler** - function - sync or async function to init/define the test suite

## Library API
- `setReporter` - function(string) - to print test results (default `console.log`)
- `globalBefore` - function(handler) - sync/async handler to perform action before all tests/suites
- `globalAfter` - function(handler) - sync/async handler to perform action after all tests/suites have ended

> Example:
```javascript
import {setReporter, globalBefore, globalAfter} from 'js-test'

setReporter(sendTestResults)

globalBefore(async () => {
	await setupDbConnection()
})

globalAfter(async () => {
	await teardownDbConnection()
})

// ... test definitions
```

## Assertion library
`js-test` contains very simple assertion library (subset of chai.assert).
- `equal` - (realValue, expectedValue, [failedMessage]) - compares given values by strict equality check (`===`).
- `deepEqual` - (realValue, expectedValue, [failedMessage]) - deeply compares all nested values and all have to match. It is not able to compare cyclic objects.
- `isTrue` - (expression, [failedMessage]) - compares if the given expression has truthy value (`Boolean(value) === true`)
- `isFalse` - (expression, [failedMessage]) - compares if the given expression has falsy value (`Boolean(value) === false`)
- `fail` - ([failedMessage]) - will always fail

## CLI interface
It is possible to run multiple test files by following command:

```
js-test [my-test-cjs-file.js] [my-test-es6-file.mjs]
```
(Mixing of CommonJS and ES6 modules is supported.)

# TODO
- make reporters better (info, error, etc.)
- implement async timeouts
