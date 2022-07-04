import isDeepEqual from './deep-equal.mjs'

const getErrorBuilder = () => {
	const error = {
		message: `Assertion failed.`,
		expected: undefined,
		given: undefined,
	}
	const printValue = (text, value) => {
		if (!value) return ''
		let result = `\n\n${text}`
		if (value.includes('\n')) {
			result += `\n${error.expected}`
		}
		else {
			result += error.expected
		}
		return result
	}

	return {
		addExpected(expected) {
			error.expected = expected
			return this
		},
		addGiven(given) {
			error.given = given
			return this
		},
		setMessage(message) {
			if (!message) return this
			error.message = message
			return this
		},

		build() {
			return new Error(`${error.message}${printValue('expected: ', error.expected)}${printValue('given: ', error.given)}`)
		},
	}
}

/**
 * @param {*} given
 * @param {*} expected
 * @param {string} msg
 */
const equal = (given, expected, msg) => {
	if (given !== expected) {
		throw getErrorBuilder()
			.setMessage(msg)
			.addExpected(expected)
			.addGiven(given)
			.build()
	}
}

/**
 * @param {*} given
 * @param {*} expected
 * @param {string} msg
 */
 const deepEqual = (given, expected, msg) => {
	const expectedStr = JSON.stringify(expected, null, '  ')
	const givenStr = JSON.stringify(given, null, '  ')

	if (!isDeepEqual(given, expected)) {
		throw getErrorBuilder()
			.setMessage(msg)
			.addExpected(expectedStr)
			.addGiven(givenStr)
			.build()
	}
}

/**
 * @param {*} expression
 * @param {string} msg
 */
const isTrue = (expression, msg) => {
	if (!expression) {
		throw getErrorBuilder()
			.setMessage(msg)
			.addExpected('true')
			.addGiven(!!expression)
			.build()
	}
}

/**
 * @param {*} expression
 * @param {string} msg
 */
const isFalse = (expression, msg) => {
	if (expression) {
		throw getErrorBuilder()
			.setMessage(msg)
			.addExpected('false')
			.addGiven(!!expression)
			.build()
	}
}

/**
 * @param {string} msg
 */
const fail = (msg) => {
	throw getErrorBuilder()
		.setMessage(msg)
		.build()
}

export default {
	equal,
	deepEqual,
	isTrue,
	isFalse,
	fail,
}
