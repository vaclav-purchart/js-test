import assert from './assert.mjs'

const VERBOSE = false

const TEST_TYPE = {
	SUITE: 'suite',
	TEST: 'test',
}

const state = {
	stack: [],
	errors: [],
	tests: [],
	reporter: console.log,
	currentSuite: null,
	testCount: 0,
	globalBeforeHandler: () => {},
	globalAfterHandler: () => {},
}

const report = (...args) => state.reporter(...args)

const verboseLog = (...args) => VERBOSE && console.log(...args)

const wrapMaybePromise = (handler, {resolve, reject}) => {
	try {
		const result = handler()
		if (result instanceof Promise) {
			result
				.then((result) => resolve(result))
				.catch((err) => reject(err))
		}
		else {
			resolve(result)
		}
	}
	catch (err) {
		reject(err)
	}
}

/**
 * @param {function(): undefined | Promise} handler
 */
const globalBefore = (handler) => {
	state.globalBeforeHandler = handler
}

/**
 * @param {function(): undefined | Promise} handler
 */
const globalAfter = (handler) => {
	state.globalAfterHandler = handler
}

/**
 * @param {Function(string)} handler
 */
const setReporter = (handler) => {
	state.reporter = handler
}

const sanitizeStack = (stack) => {
	return stack.split('\n')
		.filter(line => !line.includes('js-test/assert.mjs'))
		.join('\n')
}

/**
 * @param {string} msg
 * @param {Error} err
 * @param {Array<{stack: string[], error: Error}>} stack
 */
const reportFailure = (msg, err, stack) => {
	state.errors.push({
		stack: stack.concat(),
		error: err,
	})
	report(`${msg} ${stack.join(' -> ')}\n${sanitizeStack(err.stack)}\n\n`)
}

/**
 * @param {string} name
 * @param {function(): undefined | Promise} handler
 */
const describe = (name, handler) => {
	const parent = state.currentSuite || null
	const tests = parent ? parent.tests : state.tests

	const suiteDefinition = {
		name,
		handler,
		type: TEST_TYPE.SUITE,
		tests: [],
		parent,
	}

	tests.push(suiteDefinition)
}

/**
 * @param {string} name
 * @param {function(): undefined | Promise} handler
 */
const test = (name, handler) => {
	state.testCount++

	const parent = state.currentSuite || null
	const tests = parent ? parent.tests : state.tests

	tests.push({
		name,
		handler,
		type: TEST_TYPE.TEST,
		// tests: [],
		parent,
	})
}

const teardownHandler = () => {
	const { errors } = state
	if (state.stack.length === 0) {
		if (errors.length === 0) {
			report('Tests run completed successfully.')
		}
		else {
			report(`Tests run completed with ${errors.length} FAILURES!`)
		}
	}
}

const runTestsSequence = (tests = [], next) => {
	if (tests.length === 0) {
		next()
		return
	}
	let index = 0
	let test = tests[index]

	const sequenceIterator = () => {
		index++
		if (index >= tests.length) {
			next()
			return
		}
		runTestHandler(tests[index], sequenceIterator)
	}

	runTestHandler(tests[index], sequenceIterator)
}

const runTestHandler = (testDefinition, next) => {
	const { stack } = state
	const { name, handler, tests, type } = testDefinition
	verboseLog(`[start] ${name}`)
	stack.push(name)
	let failedMsg

	const resolve = () => {
		runTestsSequence(tests, () => {
			stack.pop()
			verboseLog(`[done] ${name}`)
			next()
		})
	}

	const reject = (err) => {
		reportFailure(failedMsg, err, stack)
		stack.pop()
		verboseLog(`[error] ${name}`)
		next()
	}

	const indent = '  '.repeat(stack.length - 1)
	if (type === TEST_TYPE.SUITE) {
		state.currentSuite = testDefinition
		failedMsg = 'Describe init failed!'
		report(`${indent}* ${name}`)
	}
	else {
		failedMsg = 'Test-case failed!'
		report(`${indent}- ${name}`)
	}
	wrapMaybePromise(handler, {resolve, reject})
}

const runAllHandler = () => {
	const { tests } = state
	if (!tests.length) {
		report('NO TESTS FOUND!')
		return
	}

	const runTests = () => {
		runTestsSequence(tests, () => {
			wrapMaybePromise(state.globalAfterHandler, {
				resolve: teardownHandler,
				reject: (err) => { throw err },
			})
		})
	}

	wrapMaybePromise(state.globalBeforeHandler, {
		resolve: runTests,
		reject: (err) => { throw err },
	})
}

setTimeout(runAllHandler, 1)

// aliases
const it = test
const suite = describe

export {
	test,
	it,

	describe,
	suite,

	assert,

	// TODO: make work with reporter better
	setReporter,

	globalBefore,
	globalAfter,
}
