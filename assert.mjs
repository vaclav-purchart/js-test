import isDeepEqual from './deep-equal.mjs'

const getCircularReplacer = () => {
	const seen = new WeakSet()
	return (key, value) => {
		if (typeof value === 'object' && value !== null) {
			if (seen.has(value)) {
				return null
			}
			seen.add(value)
		}
		return value
	}
}

const printValue = (rawValue, text = '') => {
	if (!rawValue) return ''
	let result = text ? `${text}` : ''
	let value = rawValue
	if (rawValue.toString() !== value) {
		value = JSON.stringify(value, getCircularReplacer(), '  ')
	}
	if (value.includes('\n')) {
		result += `\n${value}`
	}
	else {
		result += value
	}
	return result
}
export const _printValue = printValue

const getTextDiff = (given, expected) => {
	if (typeof given !== 'string') throw new TypeError('string required')
	if (typeof expected !== 'string') throw new TypeError('string required')
	if (given === expected) return ''
	const expectedLines = expected.split('\n')
	const givenLines = given.split('\n')

	for (let i = 0; i < expectedLines.length; i++) {
		const givenLine = givenLines[i]
		const expectedLine = expectedLines[i]

		if (givenLine == expectedLine) continue
		return {
			expected: expectedLine,
			given: givenLine,
		}
	}
	return ''
}
export const _getTextDiff = getTextDiff

const getErrorBuilder = () => {
	const error = {
		message: `Assertion failed.`,
		expected: undefined,
		given: undefined,
		hasValue: false,
	}

	return {
		addExpected(expected) {
			error.expected = expected
			error.hasValue = true
			return this
		},
		addGiven(given) {
			error.given = given
			error.hasValue = true
			return this
		},
		setMessage(message) {
			if (!message) return this
			error.message = message
			return this
		},

		build() {
			const diff = getTextDiff(
				printValue(error.given),
				printValue(error.expected),
			)
			let valuesMessage = ''
			if (error.hasValue) {
				valuesMessage =
					`\n\n>>>diff:\n` +
					`  expected: ${diff.expected}\n` +
					`  given:    ${diff.given}\n` +
					`${printValue(error.expected, '\n\n>>> expected: ')}` +
					`${printValue(error.given, '\n\n>>> given: ')}` +
					``
			}
			return new Error(
				`${error.message}` +
				`${valuesMessage}`,
			)
		},
	}
}
export const _getErrorBuilder = getErrorBuilder

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
	if (!isDeepEqual(given, expected)) {
		throw getErrorBuilder()
			.setMessage(msg)
			.addExpected(expected)
			.addGiven(given)
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
