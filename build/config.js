const { resolve } = require('./help')

const paths = {
	root: resolve('src'),
	build: resolve('dist'),
	assets: resolve('src/assets'),
	images: resolve('src/assets/images'),
	modules: resolve('node_modules')
}

module.exports = {
	paths
}
