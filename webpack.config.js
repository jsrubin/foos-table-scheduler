module.exports = {
  entry: './public/script/index.js',
  output: {
    filename: './public/script/bundle.js'
  },
  module: {
    loaders: [
      {text: /\.js$/, loader: 'jsx-loader'}
    ]
  }
};
