
const webpack = require('webpack');
const path = require('path');

// variables
const isProduction = process.env.NODE_ENV === 'production'
const sourcePath = path.join(__dirname, './src');
const dataPath = path.join(__dirname, './data');
const outPath = process.env.GITHUB ? path.join(__dirname, './_site') : path.join(__dirname, './docs');

// plugins
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ReactRefreshWebpackPlugin =
  require('@pmmmwh/react-refresh-webpack-plugin');

module.exports = {
  context: sourcePath,
  entry: { app: './index.tsx', vendor: ['react', 'react-dom', 'redux'] },
  output: {
    path: outPath,
    publicPath: isProduction ? './' : '/',
    filename: '[name].js',
  },
  // optimization: {
  //   splitChunks: {
  //     cacheGroups: {
  //       vendor:
  //           {chunks: 'initial', name: 'vendor', test: 'vendor', enforce: true},
  //     }
  //   },
  //   runtimeChunk: true
  // },
  target: 'web',
  resolve: {
    extensions: ['.js', '.ts', '.tsx'],
    // Fix webpack's default behavior to not load packages with jsnext:main
    // module (jsnext:main directs not usually distributable es6 format, but es6
    // sources)
    // mainFields: ['module', 'browser', 'main'],
    // alias: {app: path.resolve(__dirname, 'client/')}
  },
  module: {
    rules: [
      // .ts, .tsx
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      // scss
      {
        test: /\.s?css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          'css-loader',
          'postcss-loader',
          'sass-loader',
        ],
      },
      // static assets
      { test: /\.html$/, use: 'html-loader' },
      { test: /\.(a?png|svg)$/, use: 'url-loader?limit=10000' },
      {
        test: /\.(ttf|woff|woff2)$/, use: 'file-loader'
      }
    ]
  },
  plugins: [
    // new webpack.optimize.AggressiveMergingPlugin(),
    new MiniCssExtractPlugin({
      filename: !isProduction ? '[name].css' : '[name].[hash].css',
      chunkFilename: !isProduction ? '[id].css' : '[id].[hash].css',
    }),
    new HtmlWebpackPlugin({ template: 'index.html' }),
    new ReactRefreshWebpackPlugin(),
  ],
  devtool: 'eval-source-map',
  devServer: {
    contentBase: [dataPath],
    hot: true,
    stats: { warnings: false },
    proxy: {
      '/api': 'http://localhost:3000'
    }
  },
};