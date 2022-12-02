// import path from 'path'
const path = require('path')
const webpack = require('webpack')
const config = require("./cdkconfig.json")
const HTMLWebpackPlugin = require("html-webpack-plugin")
const CopyWebpackPlugin = require("copy-webpack-plugin")

module.exports = {
    entry: './src/index.ts',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist')
    },
    module:{
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.html$/,
                use: 'html-loader'
            }
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    plugins: [
        new webpack.DefinePlugin({
            __API__: JSON.stringify(config.url),
            __DEV__: process.env.DEV || false,
        }),
        new HTMLWebpackPlugin({
            template: 'src/index.html'
        }),
        new CopyWebpackPlugin({
            patterns:[
                {
                    from: 'assets/favicon.ico',
                }
            ]
        })
    ],
}

