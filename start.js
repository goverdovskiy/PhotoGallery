// ReSharper disable UseOfImplicitGlobalInFunctionScope
npm = {};
['crypto', 'http', 'fs', 'path', 'url', 'util'].forEach(function(module) {
    npm[module] = require(module);
});
npm.tools = require('./tools');
require('./server');