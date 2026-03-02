/**
 * ═══════════════════════════════════════════════════════════════
 * Capabilities Index - Re-exports
 * ═══════════════════════════════════════════════════════════════
 */

const { getChromeCapabilities } = require('./chrome');
const { getFirefoxCapabilities } = require('./firefox');
const { getEdgeCapabilities } = require('./edge');
const { getAndroidCapabilities, getAndroidChromeCapabilities } = require('./android');
const { getIOSCapabilities, getIOSSafariCapabilities } = require('./ios');

// ─── Cloud Provider Capabilities ──────────────────────────────
const {
    getBrowserStackOptions,
    getBrowserStackDesktopCapabilities,
    getBrowserStackMobileCapabilities,
    getBrowserStackAppCapabilities,
} = require('./browserstack');

const {
    getSauceConnection,
    getSauceOptions,
    getSauceDesktopCapabilities,
    getSauceMobileCapabilities,
    getSauceAppCapabilities,
} = require('./saucelabs');

const {
    getLambdaTestConnection,
    getLambdaTestOptions,
    getLambdaTestDesktopCapabilities,
    getLambdaTestMobileCapabilities,
    getLambdaTestAppCapabilities,
} = require('./lambdatest');

const {
    getPerfectoConnection,
    getPerfectoOptions,
    getPerfectoDesktopCapabilities,
    getPerfectoMobileWebCapabilities,
    getPerfectoAppCapabilities,
} = require('./perfecto');

/**
 * Resolve browser/device capabilities based on the BROWSER env variable.
 * For cloud providers, use the dedicated cloud capability functions.
 */
function resolveCapabilities(browserName, options = {}) {
    const { ConfigResolver } = require('@wdio-framework/core');
    const name = (browserName || ConfigResolver.browser).toLowerCase();

    switch (name) {
        case 'chrome':
            return getChromeCapabilities(options);
        case 'firefox':
            return getFirefoxCapabilities(options);
        case 'edge':
        case 'microsoftedge':
            return getEdgeCapabilities(options);
        case 'android':
            return getAndroidCapabilities(options);
        case 'android-chrome':
            return getAndroidChromeCapabilities(options);
        case 'ios':
            return getIOSCapabilities(options);
        case 'ios-safari':
            return getIOSSafariCapabilities(options);
        default:
            throw new Error(`Unsupported browser/platform: "${name}". Use chrome, firefox, edge, android, android-chrome, ios, or ios-safari.`);
    }
}

/**
 * Resolve cloud-provider capabilities based on CLOUD_PROVIDER env variable.
 * Delegates to the appropriate provider's desktop capability builder.
 *
 * @param {Object} [options={}] - Provider-specific options.
 * @returns {Object} WebdriverIO capability object for the configured cloud provider.
 * @throws {Error} If CLOUD_PROVIDER is not set or unsupported.
 *
 * @example
 * // Set CLOUD_PROVIDER=browserstack in .env
 * const caps = resolveCloudCapabilities({ browser: 'chrome' });
 */
function resolveCloudCapabilities(options = {}) {
    const { ConfigResolver } = require('@wdio-framework/core');
    const provider = (options.provider || ConfigResolver.get('CLOUD_PROVIDER', '')).toLowerCase();

    switch (provider) {
        case 'browserstack':
        case 'bs':
            return getBrowserStackDesktopCapabilities(options);
        case 'saucelabs':
        case 'sauce':
            return getSauceDesktopCapabilities(options);
        case 'lambdatest':
        case 'lt':
            return getLambdaTestDesktopCapabilities(options);
        case 'perfecto':
            return getPerfectoDesktopCapabilities(options);
        default:
            throw new Error(
                `Unsupported cloud provider: "${provider}". ` +
                'Set CLOUD_PROVIDER to browserstack, saucelabs, lambdatest, or perfecto.',
            );
    }
}

/**
 * Get the remote connection settings for the configured cloud provider.
 *
 * @param {string} [provider] - Override provider name.
 * @returns {{ protocol: string, hostname: string, port: number, path: string }}
 *
 * @example
 * const conn = getCloudConnection('saucelabs');
 * // { protocol: 'https', hostname: 'ondemand.us-west-1.saucelabs.com', port: 443, path: '/wd/hub' }
 */
function getCloudConnection(provider) {
    const { ConfigResolver } = require('@wdio-framework/core');
    const p = (provider || ConfigResolver.get('CLOUD_PROVIDER', '')).toLowerCase();

    switch (p) {
        case 'browserstack':
        case 'bs':
            return {
                protocol: 'https',
                hostname: 'hub-cloud.browserstack.com',
                port: 443,
                path: '/wd/hub',
            };
        case 'saucelabs':
        case 'sauce':
            return getSauceConnection();
        case 'lambdatest':
        case 'lt':
            return getLambdaTestConnection();
        case 'perfecto':
            return getPerfectoConnection();
        default:
            throw new Error(`No cloud connection for provider: "${p}".`);
    }
}

module.exports = {
    // Local browser capabilities
    getChromeCapabilities,
    getFirefoxCapabilities,
    getEdgeCapabilities,
    getAndroidCapabilities,
    getAndroidChromeCapabilities,
    getIOSCapabilities,
    getIOSSafariCapabilities,
    resolveCapabilities,

    // Cloud - BrowserStack
    getBrowserStackOptions,
    getBrowserStackDesktopCapabilities,
    getBrowserStackMobileCapabilities,
    getBrowserStackAppCapabilities,

    // Cloud - Sauce Labs
    getSauceConnection,
    getSauceOptions,
    getSauceDesktopCapabilities,
    getSauceMobileCapabilities,
    getSauceAppCapabilities,

    // Cloud - LambdaTest
    getLambdaTestConnection,
    getLambdaTestOptions,
    getLambdaTestDesktopCapabilities,
    getLambdaTestMobileCapabilities,
    getLambdaTestAppCapabilities,

    // Cloud - Perfecto
    getPerfectoConnection,
    getPerfectoOptions,
    getPerfectoDesktopCapabilities,
    getPerfectoMobileWebCapabilities,
    getPerfectoAppCapabilities,

    // Cloud helpers
    resolveCloudCapabilities,
    getCloudConnection,
};
