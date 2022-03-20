const path = require('path');
const webpack = require('webpack')

const imported = require('./node_modules/@vlsergey/js-config/src/karma');

module.exports = function (config) {
  imported(config);

  /* eslint-disable-next-line */
  config.set({
    files: [
      'test/**/*Test.ts',
    ],

    webpack: {
      ...config.webpack,
      module: {
        ...config.webpack.module,
        rules: [
          ...config.webpack.module.rules,
          {
            test: /(\.xml|\.wikitext)$/,
            loader: 'raw-loader',
            include: /test/
          }
        ]
      },
      output: {
        path: path.resolve(__dirname, '../lib/'),
      },
    }
  });
};
