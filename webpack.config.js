const path = require('path');
const HtmlWebPackPlugin = require("html-webpack-plugin");
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
module.exports = {
  module: {
    rules: [
      { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" },
    //   {
    //     test: /\.css$/,
    //     use: [
    //       'style-loader',
    //       'css-loader',
    //       'postcss-loader'
    //     ]
    //   },
    //   {
    //     test: /\.less$/,
    //     use: [
    //       'style-loader',
    //       'css-loader',
    //       'postcss-loader',
    //       'less-loader'
    //     ]
    //   },
      {
        test: /\.(png|jpg|gif|mp4|ogg|svg|woff|woff2|ttf|eot|glb|obj|gltf|hdr)$/,
        loader: 'file-loader'
      },
    ]
  },
  resolve: {
    alias: {
    //   components: path.resolve(__dirname, 'src/components/'),
    //   containers: path.resolve(__dirname, 'src/containers/'),
    //   static: path.resolve(__dirname, 'src/static/'),
    //   theme: path.resolve(__dirname, 'src/theme/'),
    },
    extensions: [
      '.js',
    //   '.jsx'
    ],
    modules: [
      path.resolve(__dirname, 'src/'),
      path.resolve(__dirname, 'node_modules/'),
    ]
  },
  plugins: [
    new HtmlWebPackPlugin({
      template: path.resolve(__dirname, 'src/index.html'),
      filename: "./index.html"
    })
  ],
  optimization: {
    minimizer: [new UglifyJsPlugin({
      include: /\/includes/,
    })],
  },
};
