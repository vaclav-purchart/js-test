#!/usr/bin/env node
const path = require('path')
const files = process.argv.slice(2)
const {promisify} = require('util')

global['@vaclav-purchart/js-test'] = 'run-via-cli'

;(async () => {
	for (const file of files) {
		const absolutePath = path.resolve(process.cwd(), file)
		if (path.extname(absolutePath) === '.mjs') {
			await import(`file://${absolutePath}`)
		}
		else {
			require(absolutePath)
		}
	}
	const {runAllHandler} = await import('./index.mjs')
	await promisify(runAllHandler)()
})()
	.then(() => {})
	.catch((err) => {throw err})
