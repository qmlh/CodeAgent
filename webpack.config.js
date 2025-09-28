const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

const isDevelopment = process.env.NODE_ENV === 'development';

// Main process configuration
const mainConfig = {
  mode: isDevelopment ? 'development' : 'production',
  target: 'electron-main',
  entry: './src/electron/main.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js'
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  node: {
    __dirname: false,
    __filename: false
  },
  externals: {
    'electron': 'commonjs electron',
    'electron-updater': 'commonjs electron-updater',
    'fsevents': 'commonjs fsevents'
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'assets'),
          to: path.resolve(__dirname, 'dist/assets'),
          noErrorOnMissing: true
        }
      ]
    })
  ]
};

// Preload script configuration
const preloadConfig = {
  mode: isDevelopment ? 'development' : 'production',
  target: 'electron-preload',
  entry: './src/electron/preload/preload.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'preload.js'
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  externals: {
    'electron': 'commonjs electron'
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
    })
  ]
};

// Renderer process configuration (React app)
const rendererConfig = {
  mode: isDevelopment ? 'development' : 'production',
  target: 'electron-renderer',
  entry: './src/renderer/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist/renderer'),
    filename: 'renderer.js',
    publicPath: isDevelopment ? '/' : './'
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true
          }
        },
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        type: 'asset/resource'
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource'
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'src/renderer'),
      '@components': path.resolve(__dirname, 'src/renderer/components'),
      '@services': path.resolve(__dirname, 'src/renderer/services'),
      '@utils': path.resolve(__dirname, 'src/renderer/utils'),
      '@types': path.resolve(__dirname, 'src/renderer/types')
    },
    fallback: {
      "buffer": require.resolve("buffer"),
      "process": require.resolve("process/browser.js"),
      "util": false,
      "path": false,
      "fs": false,
      "os": false,
      "crypto": false,
      "stream": false,
      "assert": false,
      "http": false,
      "https": false,
      "url": false,
      "zlib": false,
      "fsevents": false
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/renderer/index.html',
      filename: 'index.html'
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
      'global': 'globalThis',
      'globalThis': 'globalThis'
    }),
    new webpack.ProvidePlugin({
      global: 'globalThis',
      process: 'process/browser.js',
      Buffer: ['buffer', 'Buffer']
    }),
    new MonacoWebpackPlugin({
      languages: ['typescript', 'javascript', 'css', 'html', 'json'],
      features: [
        'bracketMatching',
        'caretOperations',
        'clipboard',
        'comment',
        'contextmenu',
        'coreCommands',
        'find',
        'folding',
        'format',
        'gotoLine',
        'indentation',
        'linesOperations',
        'multicursor',
        'smartSelect',
        'wordHighlighter',
        'wordOperations'
      ]
    })
  ],
  devtool: isDevelopment ? 'source-map' : false,
  devServer: isDevelopment ? {
    port: 8081,
    hot: true,
    static: {
      directory: path.join(__dirname, 'public'),
      publicPath: '/'
    },
    host: 'localhost',
    historyApiFallback: true,
    compress: true,
    open: false
  } : undefined
};

module.exports = [mainConfig, preloadConfig, rendererConfig];