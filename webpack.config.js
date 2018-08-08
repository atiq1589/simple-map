const path = require('path');
const MinifyPlugin = require("babel-minify-webpack-plugin");

module.exports = {
    mode: 'none',
    entry: './src/index.js',
    devtool: 'inline-source-map',
    output: {
      filename: 'main.js',
      path: path.resolve(__dirname, 'dist')
    },
    plugins: [
        // new MinifyPlugin()
      ]
  };