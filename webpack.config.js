const path = require('path')

const { ProgressPlugin } = require('webpack')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CompressionPlugin = require('compression-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const ExposeWebpackPlugin = require('./plugins/webpack-expose-plugin')

const NODE_ENV = process.env.NODE_ENV
const isDevelopment = NODE_ENV === 'development'
const hashMode = isDevelopment ? 'hash' : 'contenthash'

function resolve(dir) {
	return path.resolve(process.cwd(), dir)
}

module.exports = function () {
	/** @type import('webpack').Configuration */
	const config = {
		mode: NODE_ENV,
		target: 'web',
		devtool: isDevelopment ? 'eval-cheap-module-source-map' : false,

		entry: {
			app: resolve('src/app.js')
		},

		output: {
			pathinfo: false,
			publicPath: '/',
			path: resolve('dist'),
			filename: `js/[name].[${hashMode}].js`,
			chunkFilename: `js/bundle.[${hashMode}].js`,
			hashDigestLength: 10
		},

		optimization: {
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
				cacheGroups: {
					vendor: {
						test: /[\\/]node_modules[\\/]/,
						priority: -10,
						name: 'vendors',
						chunks: 'all'
					},
					default: {
						minSize: 0,
						minChunks: 2,
						priority: -20,
						reuseExistingChunk: true
					}
				}
			}
		},

		resolve: {
			symlinks: false,
			cacheWithContext: false,
			alias: {
				'@': resolve('src'),
				images: resolve('src/images')
			}
		},

		module: {
			rules: [
				{
					test: /\.js$/,
					include: resolve('src'),
					use: ['babel-loader']
				},
				{
					test: /\.s?css$/i,
					use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader', 'sass-loader']
				},
				{
					test: /\.(png|svg|jpg|jpeg|gif)$/i,
					type: 'asset',
					generator: {
						filename: 'images/[hash][ext][query]'
					}
				},
				{
					test: /\.(woff|woff2|eot|ttf|otf)$/i,
					type: 'asset',
					generator: {
						filename: 'fonts/[hash][ext][query]'
					}
				}
			]
		},

		plugins: [
			new CleanWebpackPlugin(),
			new ExposeWebpackPlugin({
				packages: ['jquery']
			}),
			new HtmlWebpackPlugin({ title: '管理输出' }),
			new MiniCssExtractPlugin({
				filename: `css/[name].[${hashMode}].css`,
				chunkFilename: `css/bundle.[${hashMode}].css`
			}),

			false &&
				new CompressionPlugin({
					test: /\.(js|css)$/,
					threshold: 8192
				})
		].filter(Boolean),

		devServer: {
			open: true,
			compress: true,
			clientLogLevel: 'error'
		},

		performance: {
			hints: false
		}
	}

	return config
}
