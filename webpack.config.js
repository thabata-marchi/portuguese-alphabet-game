const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production';
  const withAnalyzer = env && env.analyze;

  const plugins = [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      inject: 'body'
    })
  ];
  if (withAnalyzer) {
    plugins.push(new BundleAnalyzerPlugin());
  }

  return {
  entry: { main: './main.js' },
  output: {
    filename: '[name].abc-safari.js',
    chunkFilename: '[name].abc-safari.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true
  },
  mode: isProd ? 'production' : 'development',
  devtool: isProd ? 'source-map' : 'source-map',
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/](pixi\.js|gsap|howler|lodash)[\\/]/,
          name: 'vendor',
          filename: 'vendor.abc-safari.js'
        }
      }
    }
  },
  performance: {
    hints: isProd ? 'warning' : false,
    maxEntrypointSize: 512 * 1024,
    maxAssetSize: 512 * 1024
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        type: 'asset/resource'
      },
      {
        test: /\.(mp3|ogg|wav)$/,
        type: 'asset/resource'
      }
    ]
  },
  plugins,
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist')
    },
    port: 8080,
    hot: true,
    open: true
  },
  resolve: {
    fallback: {
      'util': false,
      'fs': false
    }
  },
  cache: {
    type: 'filesystem'
  }
  };
};
