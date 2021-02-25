const { ProvidePlugin } = require('webpack')
const TerserPlugin = require('terser-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const CompressionPlugin = require('compression-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const ConfigWebpackPlugin = require('./plugins/config-webpack-plugin')

const { paths } = require('./build/config')
const { resolve } = require('./build/help')

const NODE_ENV = process.env.NODE_ENV
const isDevelopment = NODE_ENV === 'development'
const hashMode = isDevelopment ? '' : '.[contenthash]'

/** @type import('webpack').Configuration */
module.exports = {
	cache: true,
	mode: NODE_ENV,
	target: 'web',
	devtool: isDevelopment ? 'eval-cheap-module-source-map' : false,

	entry: {
		main: resolve('src/main.js')
	},

	output: {
		pathinfo: false,
		path: paths.build,
		publicPath: '/',
		filename: `js/[name]${hashMode}.js`,
		chunkFilename: `js/bundle${hashMode}.js`,
		hashDigestLength: 8
	},

	optimization: {
		runtimeChunk: 'single',
		moduleIds: 'deterministic',
		minimize: !isDevelopment,
		minimizer: [
			new TerserPlugin({
				terserOptions: {
					format: {
						comments: false
					}
				},
				extractComments: false
			}),
			new CssMinimizerPlugin({
				minimizerOptions: {
					preset: [
						'default',
						{
							discardComments: { removeAll: true }
						}
					]
				}
			})
		],
		splitChunks: {
			chunks: 'all',
			minSize: 0,
			minChunks: 2,
			cacheGroups: {
				vendor: {
					test: /[\\/]node_modules[\\/]/,
					name: 'vendors',
					priority: 5
				},
				default: {
					priority: 0,
					reuseExistingChunk: true
				}
			}
		}
	},

	resolve: {
		symlinks: false,
		cacheWithContext: false,
		modules: [paths.modules],
		alias: {
			'@': paths.root
		}
	},

	module: {
		noParse: /jquery|lodash/,
		rules: [
			{
				oneOf: [
					{
						test: /\.js$/,
						include: resolve('src'),
						use: ['babel-loader?cacheDirectory=true']
					},
					{
						test: /\.s?css$/i,
						include: resolve('src'),
						use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader', 'sass-loader']
					},
					{
						test: /\.(jpg|jpeg|png|gif|webp)$/i,
						include: resolve('src'),
						use: [
							{
								loader: 'url-loader',
								options: {
									name: 'image/[hash:8].[ext]',
									esModule: false,
									limit: 4096
								}
							}
						]
					},
					{
						test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
						include: resolve('src'),
						loader: 'url-loader',
						options: {
							name: 'media/[hash:8].[ext]',
							esModule: false
						}
					},
					{
						test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/i,
						include: resolve('src'),
						loader: 'url-loader',
						options: {
							name: 'fonts/[hash:8].[ext]',
							esModule: false
						}
					}
				]
			}
		]
	},

	plugins: [
		new ProvidePlugin({
			$: 'jquery',
			jQuery: 'jquery'
		}),
		new ConfigWebpackPlugin(),
		new CleanWebpackPlugin(),
		new HtmlWebpackPlugin({
			filename: 'index.html',
			template: resolve('src/index.html'),
			chunks: ['main']
		}),
		new MiniCssExtractPlugin({
			filename: `css/[name]${hashMode}.css`,
			chunkFilename: `css/bundle${hashMode}.css`
		}),
		!isDevelopment &&
			new CompressionPlugin({
				test: /\.(js|css)$/,
				threshold: 8192
			})
	].filter(Boolean),

	devServer: {
		open: true,
		compress: true,
		disableHostCheck: true,
		stats: 'errors-only',
		overlay: { errors: true },
		writeToDisk: filepath => {
			return /\.html$/.test(filepath)
		}
	},

	performance: false
}
