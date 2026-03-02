/**
 * ═══════════════════════════════════════════════════════════════
 * WebdriverIO — PRODUCTION Environment Override
 * ═══════════════════════════════════════════════════════════════
 */

const { config } = require('./wdio.conf');
const { deepMerge } = require('./helpers/configHelper');
const { ConfigResolver } = require('@wdio-framework/core');

const prodConfig = deepMerge(config, {
    baseUrl: ConfigResolver.baseUrl,
    logLevel: ConfigResolver.logLevel,
    bail: 1,           // Stop on first failure in production
    cucumberOpts: {
        tagExpression: ConfigResolver.get('TAG_EXPRESSION', '@smoke'),
        retry: ConfigResolver.getInt('RETRY_COUNT', 0),
    },
});

exports.config = prodConfig;
