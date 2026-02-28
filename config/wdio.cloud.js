/**
 * ═══════════════════════════════════════════════════════════════
 * WebdriverIO — Cloud Provider Override
 * ═══════════════════════════════════════════════════════════════
 *
 * Runs tests on cloud platforms (BrowserStack, Sauce Labs, LambdaTest,
 * Perfecto) by resolving capabilities and connection from the
 * CLOUD_PROVIDER environment variable.
 *
 * Usage:
 *   CLOUD_PROVIDER=browserstack npx wdio run config/wdio.cloud.js
 *   CLOUD_PROVIDER=saucelabs    npx wdio run config/wdio.cloud.js
 *   CLOUD_PROVIDER=lambdatest   npx wdio run config/wdio.cloud.js
 *   CLOUD_PROVIDER=perfecto     npx wdio run config/wdio.cloud.js
 *
 * Required: Set the provider's credentials (USERNAME / ACCESS_KEY)
 * via .env or environment variables.
 *
 * @see config/capabilities/browserstack.js
 * @see config/capabilities/saucelabs.js
 * @see config/capabilities/lambdatest.js
 * @see config/capabilities/perfecto.js
 */

const { config } = require('./wdio.conf');
const { deepMerge } = require('./helpers/configHelper');
const { ConfigResolver } = require('@wdio-framework/core');
const { resolveCloudCapabilities, getCloudConnection } = require('./capabilities');

// ConfigResolver.init() is already called by wdio.conf.js (loaded above).

const provider = ConfigResolver.get('CLOUD_PROVIDER', '');

if (!provider) {
    throw new Error(
        'CLOUD_PROVIDER not set. Set it to browserstack, saucelabs, lambdatest, or perfecto.',
    );
}

const connection = getCloudConnection(provider);
const capabilities = [resolveCloudCapabilities()];

const cloudConfig = deepMerge(config, {
    // Remote connection (replaces local WebDriver)
    protocol: connection.protocol,
    hostname: connection.hostname,
    port: connection.port,
    path: connection.path,

    // Cloud capabilities
    capabilities,

    // Cloud-optimised settings
    connectionRetryTimeout: 180000,
    connectionRetryCount: 3,

    // Disable local services when running on cloud
    services: [],

    // Cloud providers need longer timeouts
    waitforTimeout: ConfigResolver.getInt('TIMEOUT_IMPLICIT', 15000),

    baseUrl: ConfigResolver.baseUrl,
    logLevel: ConfigResolver.logLevel,

    cucumberOpts: {
        tagExpression: ConfigResolver.get('TAG_EXPRESSION', ''),
    },
});

exports.config = cloudConfig;
