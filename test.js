const { describe, test, assert } = require('./index.build.cjs')

describe('test suite', () => {
	test('test case', () => {
		assert.isTrue(true)
	})
})
