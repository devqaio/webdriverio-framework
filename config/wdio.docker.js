/**
 * ═══════════════════════════════════════════════════════════════
 * WebdriverIO — Docker / Selenium Grid Override
 * ═══════════════════════════════════════════════════════════════
 */

const { config } = require('./wdio.conf');
const { deepMerge } = require('./helpers/configHelper');
const { ConfigResolver } = require('@wdio-framework/core');

const dockerConfig = deepMerge(config, {
    hostname: ConfigResolver.get('SELENIUM_HUB_HOST', 'selenium-hub'),
    port: ConfigResolver.getInt('SELENIUM_HUB_PORT', 4444),
    path: '/wd/hub',
    logLevel: 'warn',
    capabilities: [
        {
            maxInstances: 5,
            browserName: 'chrome',
            'goog:chromeOptions': {
                args: [
                    '--headless=new',
                    '--no-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--window-size=1920,1080',
                ],
            },
        },
    ],
});

exports.config = dockerConfig;
