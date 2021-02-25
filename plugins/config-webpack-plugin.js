const { Compiler } = require('webpack')
const url = require('url')
const portfinder = require('portfinder')
const pluginName = 'ConfigWebpackPlugin'
class ConfigWebpackPlugin {
	constructor() {}
	/** @param {Compiler} compiler */
	apply(compiler) {
		this.setPublicPath(compiler)
	}

	/** @param {Compiler} compiler */
	async setPublicPath(compiler) {
		const options = compiler.options
		if (options.mode !== 'development') return

		let port

		const protocol = options.https ? 'https' : 'http'
		const hostname = options.devServer.host || 'localhost'

		portfinder.basePort = options.devServer.port || 8080

		try {
			port = await portfinder.getPortPromise()
		} catch {}

		options.devServer.port = port
		options.output.publicPath = url.format({ protocol, port, hostname })
	}
}

module.exports = ConfigWebpackPlugin
