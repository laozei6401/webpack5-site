const fs = require('fs')
const url = require('url')
const path = require('path')
const { glob } = require('glob')
const portfinder = require('portfinder')

const HtmlWebpackPlugin = require('html-webpack-plugin')

function resolve(dir) {
	return path.resolve(process.cwd(), dir)
}

function optPort(options) {
	return new Promise((resolve, reject) => {
		if (options.mode !== 'development') {
			return resolve(options)
		}

		portfinder.basePort = options.devServer.port || 8080
		portfinder.getPort(function (err, port) {
			if (err) {
				return reject(err)
			}
			const protocol = options.https ? 'https' : 'http'
			const hostname = options.devServer.host || 'localhost'

			options.devServer.port = port
			options.devServer.host = '0.0.0.0'
			options.devServer.useLocalIp = true

			options.output.publicPath = url.format({ protocol, port, hostname })

			resolve(options)
		})
	})
}

function generateEntries() {
	const Hash = require('hash-sum')

	const entries = {
		main: [resolve('src/main.js'), resolve('src/styles/index.scss')]
	}
	const htmlPlugins = []
	const files = glob.sync(resolve(`src/views/**/index.html`))

	files.forEach(file => {
		const chunks = ['main']
		const selfChunk = []

		const pathinfo = path.parse(file)
		const name = file.match(/\/views\/(.*?)\/index\.html/)[1]
		const hash = `chunk-${Hash(name)}`

		const entryFiles = [path.join(pathinfo.dir, 'index.js'), path.join(pathinfo.dir, 'index.scss')]

		Array.prototype.forEach.call(entryFiles, file => {
			if (fs.existsSync(file)) {
				selfChunk.push(file)
			}
		})

		if (selfChunk.length) {
			chunks.push(hash)
			entries[hash] = selfChunk
		}

		htmlPlugins.push(
			new HtmlWebpackPlugin({
				template: file,
				filename: path.join('html', name) + '.html',
				scriptLoading: 'blocking',
				minify: {
					minifyJS: true,
					removeComments: true,
					collapseWhitespace: true,
					continueOnParseError: true,
					collapseBooleanAttributes: true,
					removeScriptTypeAttributes: true
				}
			})
		)
	})

	return {
		entries,
		htmlPlugins
	}
}

module.exports = {
	resolve,
	optPort,
	generateEntries
}
