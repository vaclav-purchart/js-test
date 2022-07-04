#!/usr/bin/env node
const path = require('path')
const files = process.argv.slice(2)

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
})()
	.then(() => {})
	.catch((err) => {throw err})
