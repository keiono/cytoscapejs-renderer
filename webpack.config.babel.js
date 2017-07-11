const webpack = require('webpack');
const path = require('path');

export default () => ({
  context: path.join(__dirname, './src'),

  entry: {
    app: './CytoscapeJsRenderer.jsx'
  },

  output: {
    path: path.join(__dirname, "build"),
    library: "CytoscapeJsRenderer",
    libraryTarget: "umd",
    filename: "CytoscapeJsRenderer.js"
  },

  module: {
    rules: [
      {
        test: /\.(js|jsx)?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['es2015', 'stage-0', 'react']
          }
        }
      }
    ]
  },

  externals: {
    'react': {
      commonjs: 'react',
      commonjs2: 'react',
      amd: 'react',
      root: 'React'
    },
    'prop-types': {
      commonjs: 'prop-types',
      commonjs2: 'prop-types',
      amd: 'prop-types',
      root: 'PropTypes'
    }
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },

  plugins: [
    new webpack.NamedModulesPlugin()
  ]
});
