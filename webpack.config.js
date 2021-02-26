const { ProvidePlugin } = require('webpack')
const TerserPlugin = require('terser-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const CompressionPlugin = require('compression-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')

const { paths } = require('./build/config')
const { optPort, generateEntries } = require('./build/help')

const { entries, htmlPlugins } = generateEntries()

const NODE_ENV = process.env.NODE_ENV
const isDevelopment = NODE_ENV === 'development'
const hashMode = isDevelopment ? '' : '.[contenthash]'

/** @type import('webpack').Configuration */
const webpackConfig = {
	cache: true,
	mode: NODE_ENV,
	target: 'web',
	devtool: isDevelopment ? 'eval-cheap-module-source-map' : false,

	entry: entries,

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
		removeEmptyChunks: true,
		moduleIds: 'deterministic',

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
			'@': paths.root,
			images: paths.images
		}
	},

	module: {
		noParse: /jquery|lodash/,
		rules: [
			{
				oneOf: [
					{
						test: /\.html$/,
						include: paths.root,
						use: [
							'handlebars-loader',
							'extract-loader',
							{
								loader: 'html-loader',
								options: {
									esModule: false
								}
							}
						]
					},
					{
						test: /\.js$/,
						include: paths.root,
						use: ['babel-loader?cacheDirectory=true']
					},
					{
						test: /\.s?css$/i,
						include: paths.root,
						use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader', 'postcss-loader']
					},
					{
						test: /\.(jpg|jpeg|png|gif|webp)$/i,
						include: paths.root,
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
						include: paths.root,
						loader: 'url-loader',
						options: {
							name: 'media/[hash:8].[ext]',
							esModule: false
						}
					},
					{
						test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/i,
						include: paths.root,
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
		new CleanWebpackPlugin(),
		...htmlPlugins,
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
		stats: 'errors-only',
		disableHostCheck: true,
		overlay: { errors: true },
		writeToDisk: filepath => /\.html$/.test(filepath)
	},

	performance: false
}

module.exports = optPort(webpackConfig)
