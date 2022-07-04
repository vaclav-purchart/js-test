import {
	test,
	it,

	describe,
	suite,

	assert,

	globalBefore,
	globalAfter,
} from './index.mjs'

globalBefore(async () => new Promise((resolve) => {
	setTimeout(() => {
		console.log('global init')
		resolve()
	}, 50)
}))

globalAfter(async () => new Promise((resolve) => {
	setTimeout(() => {
		console.log('global teardown')
		resolve()
	}, 50)
}))

describe('simple test-suite', () => {
	test('test case defined with TEST', () => {
		assert.equal(1, 1, 'it should work')
	})

	it('test case with defined with IT', () => {
		assert.equal(1, 1, 'it should work')
	})
})

suite('nested suites', () => {
	describe('inner suite', () => {
		test('nested test case', () => {
			assert.isTrue(true, 'it should work')
		})
	})

	test('not nested test case', () => {
		assert.isTrue(true, 'it should work')
	})
})

describe('async test suite', () => {
	test('async test #1', async () => {
		return new Promise((resolve, _reject) => {
			setTimeout(() => {
				assert.isTrue(true, 'it should work')
				resolve()
			}, 2)
		})
	})

	test('async test #2', async () => {
		return new Promise((resolve, _reject) => {
			setTimeout(() => {
				assert.isTrue(true, 'it should work')
				resolve()
			}, 1)
		})
	})

	test('sync test in async sequence', async () => {
		assert.isTrue(true, 'it should work')
	})
})

describe('test failures', () => {
	test('simple test - catch error', () => {
		try {
			assert.deepEqual({a: 1}, {a: 2}, 'will fail')
		}
		catch (err) {
			err.message.includes(`will fail

				expected:
				{
				"a": 2
				}

				but given:
				{
				"a": 1
				}
			`.replace(/^\t+/g, ''))
		}
	})

	test('async test - catch error', async () => {
		try {
			assert.deepEqual({a: 1}, {a: 2}, 'will fail')
		}
		catch (err) {
			err.message.includes(`will fail

				expected:
				{
				"a": 2
				}

				but given:
				{
				"a": 1
				}
			`.replace(/^\t+/g, ''))
		}
	})

	test('will print error', () => {
		assert.fail('complete error')
	})
})
