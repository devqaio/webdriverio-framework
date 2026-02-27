/**
 * ═══════════════════════════════════════════════════════════════
 * WebdriverIO — PRODUCTION Environment Override
 * ═══════════════════════════════════════════════════════════════
 */

const { config } = require('./wdio.conf');
const { deepMerge } = require('./helpers/configHelper');

const prodConfig = deepMerge(config, {
    baseUrl: process.env.BASE_URL_PROD || 'https://www.example.com',
    logLevel: 'error',
    bail: 1,           // Stop on first failure in production
    cucumberOpts: {
        tagExpression: process.env.TAG_EXPRESSION || '@smoke',
        retry: 0,      // No retries in production
    },
});

exports.config = prodConfig;
