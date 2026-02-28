/**
 * ═══════════════════════════════════════════════════════════════
 * WebdriverIO — DEV Environment Override
 * ═══════════════════════════════════════════════════════════════
 */

const { config } = require('./wdio.conf');
const { deepMerge } = require('./helpers/configHelper');
const { ConfigResolver } = require('@wdio-framework/core');

// ConfigResolver.init() is already called by wdio.conf.js (loaded above).
// The env_config layer for 'dev' supplies BASE_URL, TAG_EXPRESSION, etc.
const devConfig = deepMerge(config, {
    baseUrl: ConfigResolver.baseUrl,
    logLevel: ConfigResolver.logLevel,
    cucumberOpts: {
        tagExpression: ConfigResolver.get('TAG_EXPRESSION', 'not @prod-only'),
    },
});

exports.config = devConfig;
