/**
 * ═══════════════════════════════════════════════════════════════
 * WebdriverIO — DEV Environment Override
 * ═══════════════════════════════════════════════════════════════
 */

const { config } = require('./wdio.conf');
const { deepMerge } = require('./helpers/configHelper');

const devConfig = deepMerge(config, {
    baseUrl: process.env.BASE_URL_DEV || 'https://dev.example.com',
    logLevel: 'info',
    cucumberOpts: {
        tagExpression: process.env.TAG_EXPRESSION || 'not @prod-only',
    },
});

exports.config = devConfig;
