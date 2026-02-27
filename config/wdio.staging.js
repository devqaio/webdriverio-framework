/**
 * ═══════════════════════════════════════════════════════════════
 * WebdriverIO — STAGING Environment Override
 * ═══════════════════════════════════════════════════════════════
 */

const { config } = require('./wdio.conf');
const { deepMerge } = require('./helpers/configHelper');

const stagingConfig = deepMerge(config, {
    baseUrl: process.env.BASE_URL_STAGING || 'https://staging.example.com',
    logLevel: 'warn',
    cucumberOpts: {
        tagExpression: process.env.TAG_EXPRESSION || '@smoke or @regression',
    },
});

exports.config = stagingConfig;
