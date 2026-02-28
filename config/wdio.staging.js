/**
 * ═══════════════════════════════════════════════════════════════
 * WebdriverIO — STAGING Environment Override
 * ═══════════════════════════════════════════════════════════════
 */

const { config } = require('./wdio.conf');
const { deepMerge } = require('./helpers/configHelper');
const { ConfigResolver } = require('@wdio-framework/core');

const stagingConfig = deepMerge(config, {
    baseUrl: ConfigResolver.baseUrl,
    logLevel: ConfigResolver.logLevel,
    cucumberOpts: {
        tagExpression: ConfigResolver.get('TAG_EXPRESSION', '@smoke or @regression'),
    },
});

exports.config = stagingConfig;
