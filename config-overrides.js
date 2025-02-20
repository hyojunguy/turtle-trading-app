const webpack = require('webpack');

module.exports = function override(config, env) {
  // SQL.js용 폴리필 추가
  config.resolve.fallback = {
    ...config.resolve.fallback,
    fs: false,
    path: false,
    crypto: false
  };

  return config;
}; 