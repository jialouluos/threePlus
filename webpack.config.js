//引入一个包
const path = require("path");
const HYMLWebpackPlugin = require("html-webpack-plugin");
const ESLintPlugin = require("eslint-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin")
//webpack中的所有配置信息都应该写在module.exports中
module.exports = {
	entry: `./index.ts`,//指定入口文件
	output: {//指定打包文件的目录
		path: path.resolve(__dirname, "dist"),
		filename: "js/bundle.js",
		clean: true,
	},
	//指定webpack打包时要使用的模块
	module: {
		//指定要加载的规则
		rules: [
			{
				test: /\.(ts)$/,
				use: "babel-loader",
				//要排除的文件
				exclude: /node-modules/
			},
			{
				test: /\.less$/i,
				use: ["style-loader", "css-loader", "less-loader"],
				exclude: /node-modules/
			},
			{
				test: /\.(png|jpe?g|gif|webp|svg|hdr)$/,
				type: "asset",
				parser: {
					dataUrlCondtion: {
						maxSize: 10 * 1024
					}
				},
				generator: {
					filename: "image/[hash:5][ext]"
				},
				exclude: /node-modules/
			}, {
				test: /\.(glsl|vs|fs)$/,
				exclude: /node_modules/,
				use: [
					'ts-shader-loader'
				]
			},
		]
	},
	mode: "development",//配置工作模式
	devtool: "cheap-module-source-map",
	plugins: [
		new HYMLWebpackPlugin({
			// title:"这是自定义的title"
			template: path.resolve(__dirname, `index.html`),
		}),
		new ESLintPlugin({
			fix: false, /* 自动帮助修复 */
			context: path.resolve(__dirname, `index.ts`),
			extensions: ["js", "ts", "json",],
			exclude: "node_modules"
		})
	],
	devServer: {
		host: "localhost",
		port: "3000",
		open: true,
		hot: true,
	},
	resolve: {
		extensions: [".ts", ".js"],//解决ts模块引入失败问题
		alias: {
			'@': path.resolve(__dirname, 'src'),
			"@type": path.resolve(__dirname, 'types'),
			"@Main": path.resolve(__dirname, './src/components/Main'),
		}
	},

};
