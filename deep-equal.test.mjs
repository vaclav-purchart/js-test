import {describe, it, assert} from '.'

describe('deep-equal.test.mjs - deep-equal', () => {
	describe('primitives', () => {
		it('success', () => {
			assert.deepEqual(1, 1)
		})
		it('failure', () => {
			try {
				assert.deepEqual(1, 2)
			}
			catch (err) {
				return
			}
			assert.fail('should have failed')
		})
	})

	describe('objects', () => {
		it('success', () => {
			assert.deepEqual({a: 1}, {a: 1})
		})
		it('failure', () => {
			try {
				assert.deepEqual({a: 1}, {b: 1})
			}
			catch (err) {
				return
			}
			assert.fail('should have failed')
		})
	})

	describe('objects - different order', () => {
		it('success', () => {
			assert.deepEqual({a: 1, b: 2, c: 3}, {c: 3, b: 2, a: 1})
		})
	})

	describe('array', () => {
		it('success', () => {
			assert.deepEqual([1, 'a', {a: 1, b: 2}], [1, 'a', {b: 2, a: 1}])
		})
		it('failure', () => {
			try {
				assert.deepEqual([1, 2, 3], [2, 3, 4])
			}
			catch (err) {
				return
			}
			assert.fail('should have failed')
		})
	})
})
