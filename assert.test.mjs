import {describe, test, assert} from './index.mjs'
import {_printValue, _getTextDiff} from './assert.mjs'

const trim = (str) => str.replace(/^\s+/gm, '').replace(/\s+$/gm, '')

describe('assert.test.mjs - assert tests', () => {
	describe('printValue', () => {
		test('string', () => assert.equal(_printValue('test string'), 'test string'))
		test('number', () => assert.equal(_printValue(123), '123'))
		test('array', () => assert.equal(trim(_printValue([1, 'a', {x: 2}])), trim(`[
			1,
			"a",
			{
				"x": 2
			}
		]`)))
		test('object', () => assert.equal(trim(_printValue({a: 'test'})), trim(`{
			"a": "test"
		}`)))
		test('object-circular', () => {
			const first = {order: 1, prev: null, next: null}
			const second = {order: 2, prev: null, next: null}
			first.next = second
			second.prev = first
			assert.equal(trim(_printValue(first)), trim(`{
				"order": 1,
				"prev": null,
				"next": {
					"order": 2,
					"prev": null,
					"next": null
				}
			}`))
		})
		test('with prefix', () => assert.equal(_printValue('value', 'test prefix:'), 'test prefix:value'))
	})

	test('_getTextDiff', () => {
		const expected = `[\n` +
		`	{"valid-prop": true},\n` +
		`	{"invalid-prop": false},\n` +
		`	{"valid-prop": true},\n` +
		`]`

		const given = `[\n` +
		`	{"valid-prop": true},\n` +
		`	{"invalid-prop": true},\n` +
		`	{"valid-prop": true},\n` +
		`]`

		assert.deepEqual(_getTextDiff(given, expected), {
			expected: `	{"invalid-prop": false},`,
			given: `	{"invalid-prop": true},`,
		})
	})

	test('print circular dependency - will fail with diff', () => {
		const first = {order: 1, prev: null, next: null}
		const second = {order: 2, prev: null, next: null}

		first.next = second
		second.prev = first

		try {
			assert.equal(first, second)
		}
		catch (err) {
			assert.equal(trim(err.message), trim(`Assertion failed.

			>>>diff:
			  expected:   "order": 2,
			  given:      "order": 1,


			>>> expected:
			{
			  "order": 2,
			  "prev": {
				"order": 1,
				"prev": null,
				"next": null
			  },
			  "next": null
			}

			>>> given:
			{
			  "order": 1,
			  "prev": null,
			  "next": {
				"order": 2,
				"prev": null,
				"next": null
			  }
			}`))
			return
		}
		assert.fail('error not thrown!')
	})
})
