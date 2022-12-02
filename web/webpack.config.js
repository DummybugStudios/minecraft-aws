// import path from 'path'
const path = require('path')
const webpack = require('webpack')
const config = require("./cdkconfig.json")

module.exports = {
    entry: './src/index.ts',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist')
    },
    module:{
        rules: [{
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/,
        }],
    },
    plugins: [
        new webpack.DefinePlugin({
            __API__: JSON.stringify(config.url)
        })
    ],
}

