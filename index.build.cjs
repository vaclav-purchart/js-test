'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

// TODO: make it nicer and more universal

// https://stackoverflow.com/questions/25456013/javascript-deepequal-comparison

// check if value is primitive
function isPrimitive(obj) {
	return (obj !== Object(obj))
}

function isDeepEqual(obj1, obj2) {

	if (obj1 === obj2) // it's just the same object. No need to compare.
		return true

	if (isPrimitive(obj1) && isPrimitive(obj2)) // compare primitives
		return obj1 === obj2

	if (Object.keys(obj1).length !== Object.keys(obj2).length)
		return false

	// compare objects with same number of keys
	for (let key in obj1) {
		if (!(key in obj2)) return false //other object doesn't have this prop
		if (!isDeepEqual(obj1[key], obj2[key])) return false
	}

	return true
}

const getCircularReplacer = () => {
	const seen = new WeakSet();
	return (key, value) => {
		if (typeof value === 'object' && value !== null) {
			if (seen.has(value)) {
				return null
			}
			seen.add(value);
		}
		return value
	}
};

const printValue = (rawValue, text = '') => {
	if (!rawValue) return ''
	let result = text ? `${text}` : '';
	let value = rawValue;
	if (rawValue.toString() !== value) {
		value = JSON.stringify(value, getCircularReplacer(), '  ');
	}
	if (value.includes('\n')) {
		result += `\n${value}`;
	}
	else {
		result += value;
	}
	return result
};

const getTextDiff = (given, expected) => {
	if (typeof given !== 'string') throw new TypeError('string required')
	if (typeof expected !== 'string') throw new TypeError('string required')
	if (given === expected) return ''
	const expectedLines = expected.split('\n');
	const givenLines = given.split('\n');

	for (let i = 0; i < expectedLines.length; i++) {
		const givenLine = givenLines[i];
		const expectedLine = expectedLines[i];

		if (givenLine == expectedLine) continue
		return {
			expected: expectedLine,
			given: givenLine,
		}
	}
	return ''
};

const getErrorBuilder = () => {
	const error = {
		message: `Assertion failed.`,
		expected: undefined,
		given: undefined,
		hasValue: false,
	};

	return {
		addExpected(expected) {
			error.expected = expected;
			error.hasValue = true;
			return this
		},
		addGiven(given) {
			error.given = given;
			error.hasValue = true;
			return this
		},
		setMessage(message) {
			if (!message) return this
			error.message = message;
			return this
		},

		build() {
			const diff = getTextDiff(
				printValue(error.given),
				printValue(error.expected),
			);
			let valuesMessage = '';
			if (error.hasValue) {
				valuesMessage =
					`\n\n>>>diff:\n` +
					`  expected: ${diff.expected}\n` +
					`  given:    ${diff.given}\n` +
					`${printValue(error.expected, '\n\n>>> expected: ')}` +
					`${printValue(error.given, '\n\n>>> given: ')}` +
					``;
			}
			return new Error(
				`${error.message}` +
				`${valuesMessage}`,
			)
		},
	}
};

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
};

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
};

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
};

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
};

/**
 * @param {string} msg
 */
const fail = (msg) => {
	throw getErrorBuilder()
		.setMessage(msg)
		.build()
};

var assert = {
	equal,
	deepEqual,
	isTrue,
	isFalse,
	fail,
};

const TEST_TYPE = {
	SUITE: 'suite',
	TEST: 'test',
};

const state = {
	stack: [],
	errors: [],
	tests: [],
	reporter: console.log,
	currentSuite: null,
	testCount: 0,
	globalBeforeHandler: () => {},
	globalAfterHandler: () => {},
};

const report = (...args) => state.reporter(...args);

const wrapMaybePromise = (handler, {resolve, reject}) => {
	try {
		const result = handler();
		if (result instanceof Promise) {
			result
				.then((result) => resolve(result))
				.catch((err) => reject(err));
		}
		else {
			resolve(result);
		}
	}
	catch (err) {
		reject(err);
	}
};

/**
 * @param {function(): undefined | Promise} handler
 */
const globalBefore = (handler) => {
	state.globalBeforeHandler = handler;
};

/**
 * @param {function(): undefined | Promise} handler
 */
const globalAfter = (handler) => {
	state.globalAfterHandler = handler;
};

/**
 * @param {Function(string)} handler
 */
const setReporter = (handler) => {
	state.reporter = handler;
};

const sanitizeStack = (stack) => {
	return stack.split('\n')
		.filter((line) => !line.includes('js-test/assert.mjs'))
		.join('\n')
};

/**
 * @param {string} msg
 * @param {Error} err
 * @param {Array<{stack: string[], error: Error}>} stack
 */
const reportFailure = (msg, err, stack) => {
	state.errors.push({
		stack: stack.concat(),
		error: err,
	});
	report(`${msg} ${stack.join(' -> ')}\n${sanitizeStack(err.stack)}\n\n`);
};

/**
 * @param {string} name
 * @param {function(): undefined | Promise} handler
 */
const describe = (name, handler) => {
	const parent = state.currentSuite || null;
	const tests = parent ? parent.tests : state.tests;

	const suiteDefinition = {
		name,
		handler,
		type: TEST_TYPE.SUITE,
		tests: [],
		parent,
	};
	tests.push(suiteDefinition);
};

/**
 * @param {string} name
 * @param {function(): undefined | Promise} handler
 */
const test = (name, handler) => {
	state.testCount++;

	const parent = state.currentSuite || null;
	const tests = parent ? parent.tests : state.tests;
	tests.push({
		name,
		handler,
		type: TEST_TYPE.TEST,
		// tests: [],
		parent,
	});
};

const teardownHandler = () => {
	const {errors} = state;
	if (state.stack.length === 0) {
		if (errors.length === 0) {
			report('Tests run completed successfully.');
		}
		else {
			report(`Tests run completed with ${errors.length} FAILURES!`);
		}
	}
};

const runTestsSequence = (tests = [], next) => {
	if (tests.length === 0) {
		next();
		return
	}
	let index = 0;
	const sequenceIterator = () => {
		index++;
		if (index >= tests.length) {
			next();
			return
		}
		runTestHandler(tests[index], sequenceIterator);
	};

	runTestHandler(tests[index], sequenceIterator);
};

const runTestHandler = (testDefinition, next) => {
	const {stack} = state;
	const {name, handler, tests, type} = testDefinition;
	stack.push(name);
	let failedMsg;

	const resolve = () => {
		runTestsSequence(tests, () => {
			stack.pop();
			next();
		});
	};

	const reject = (err) => {
		reportFailure(failedMsg, err, stack);
		stack.pop();
		next();
	};

	const indent = '  '.repeat(stack.length - 1);
	if (type === TEST_TYPE.SUITE) {
		state.currentSuite = testDefinition;
		failedMsg = 'Describe init failed!';
		report(`${indent}* ${name}`);
	}
	else {
		failedMsg = 'Test-case failed!';
		report(`${indent}- ${name}`);
	}
	wrapMaybePromise(handler, {resolve, reject});
};

const runAllHandler = (next) => {
	const {tests} = state;
	if (!tests.length) {
		report('NO TESTS FOUND!');
		return
	}

	const runTests = () => {
		runTestsSequence(tests, () => {
			wrapMaybePromise(state.globalAfterHandler, {
				resolve: () => {
					teardownHandler();
					next && next();
				},
				reject: (err) => { throw err },
			});
		});
	};

	wrapMaybePromise(state.globalBeforeHandler, {
		resolve: runTests,
		reject: (err) => { throw err },
	});
};

let runViaCli = typeof global !== 'undefined' && global['@vaclav-purchart/js-test'] === 'run-via-cli';

if (!runViaCli) {
	setTimeout(runAllHandler, 1);
}

// aliases
const it = test;
const suite = describe;

exports.assert = assert;
exports.describe = describe;
exports.globalAfter = globalAfter;
exports.globalBefore = globalBefore;
exports.it = it;
exports.runAllHandler = runAllHandler;
exports.setReporter = setReporter;
exports.suite = suite;
exports.test = test;
