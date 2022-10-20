// import path from 'path'
const path = require('path')
const webpack = require('webpack')

var apiURL; 
function setupAPI() {
    apiURL = process.env.API
}
setupAPI();

module.exports = {
    entry: './src/index.js',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist')
    },
    plugins: [
        new webpack.DefinePlugin({
            __API__: apiURL
        })
    ]
}

