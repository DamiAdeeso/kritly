const { composePlugins, withNx } = require('@nx/webpack');

module.exports = composePlugins(withNx(), (config) => {
  // Configure for Node.js environment
  config.target = 'node';
  
  return config;
});
