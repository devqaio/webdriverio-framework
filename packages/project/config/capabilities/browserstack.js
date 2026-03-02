/**
 * ═══════════════════════════════════════════════════════════════
 * BrowserStack Cloud Capabilities
 * ═══════════════════════════════════════════════════════════════
 *
 * Generates WebdriverIO capabilities for running tests on BrowserStack.
 * Supports desktop browsers AND mobile devices/emulators.
 *
 * Required environment variables (set via .env or ConfigResolver):
 *   BROWSERSTACK_USERNAME   — BrowserStack account username
 *   BROWSERSTACK_ACCESS_KEY — BrowserStack access key
 *
 * Optional environment variables:
 *   BROWSERSTACK_PROJECT     — Project name (default: ConfigResolver.get('PROJECT_NAME'))
 *   BROWSERSTACK_BUILD       — Build name (default: auto-generated with timestamp)
 *   BROWSERSTACK_LOCAL       — Enable BrowserStack Local tunnel ('true'/'false')
 *   BROWSERSTACK_LOCAL_ID    — Identifier for the Local tunnel instance
 *   BROWSERSTACK_DEBUG       — Enable visual logs ('true'/'false')
 *   BROWSERSTACK_NETWORK_LOGS — Capture network logs ('true'/'false')
 *   BROWSERSTACK_CONSOLE_LOGS — Capture console logs: 'disable'|'errors'|'warnings'|'info'|'verbose'
 *   BROWSERSTACK_VIDEO       — Record video ('true'/'false', default: 'true')
 *   BROWSERSTACK_OS          — OS name (e.g. 'Windows', 'OS X')
 *   BROWSERSTACK_OS_VERSION  — OS version (e.g. '11', 'Sonoma')
 *   BROWSERSTACK_RESOLUTION  — Screen resolution (e.g. '1920x1080')
 *   BROWSERSTACK_DEVICE      — Mobile device name (e.g. 'iPhone 15', 'Samsung Galaxy S24')
 *   BROWSERSTACK_REAL_MOBILE — Use real mobile device ('true'/'false')
 *   BROWSERSTACK_APP_URL     — BrowserStack app URL (bs://appHash) for mobile app testing
 *   BROWSERSTACK_APPIUM_VERSION — Appium version to use on BrowserStack
 *
 * @module capabilities/browserstack
 * @see {@link https://www.browserstack.com/automate/capabilities|BrowserStack Capabilities}
 */

const { ConfigResolver } = require('@wdio-framework/core');

/**
 * Build BrowserStack `bstack:options` capability block.
 *
 * @param {Object} [overrides={}] - Override any bstack:options field.
 * @returns {Object} The `bstack:options` capability object.
 *
 * @example
 * const opts = getBrowserStackOptions({ sessionName: 'Login Suite' });
 * // { userName: '...', accessKey: '...', projectName: '...', ... }
 */
function getBrowserStackOptions(overrides = {}) {
    const username = ConfigResolver.get('BROWSERSTACK_USERNAME');
    const accessKey = ConfigResolver.get('BROWSERSTACK_ACCESS_KEY');

    if (!username || !accessKey) {
        throw new Error(
            'BrowserStack credentials missing. Set BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY.',
        );
    }

    const buildName =
        ConfigResolver.get('BROWSERSTACK_BUILD') ||
        `Build-${new Date().toISOString().replace(/[:.]/g, '-')}`;

    return {
        userName: username,
        accessKey: accessKey,
        projectName: ConfigResolver.get('BROWSERSTACK_PROJECT') || ConfigResolver.get('PROJECT_NAME', 'wdio-tests'),
        buildName,
        sessionName: overrides.sessionName || 'Automated Test',
        local: ConfigResolver.getBool('BROWSERSTACK_LOCAL'),
        localIdentifier: ConfigResolver.get('BROWSERSTACK_LOCAL_ID', '') || undefined,
        debug: ConfigResolver.getBool('BROWSERSTACK_DEBUG'),
        networkLogs: ConfigResolver.getBool('BROWSERSTACK_NETWORK_LOGS'),
        consoleLogs: ConfigResolver.get('BROWSERSTACK_CONSOLE_LOGS', 'errors'),
        video: ConfigResolver.getBool('BROWSERSTACK_VIDEO', true),
        os: ConfigResolver.get('BROWSERSTACK_OS', '') || undefined,
        osVersion: ConfigResolver.get('BROWSERSTACK_OS_VERSION', '') || undefined,
        resolution: ConfigResolver.get('BROWSERSTACK_RESOLUTION', '') || undefined,
        ...overrides,
    };
}

/**
 * Get BrowserStack desktop browser capabilities.
 *
 * @param {Object} [options={}]
 * @param {string} [options.browser='chrome'] - Browser name: chrome, firefox, edge, safari.
 * @param {string} [options.browserVersion='latest'] - Browser version or 'latest'.
 * @param {Object} [options.bstackOverrides={}] - Override bstack:options fields.
 * @returns {Object} WebdriverIO capability object for BrowserStack desktop.
 *
 * @example
 * const caps = getBrowserStackDesktopCapabilities({ browser: 'safari' });
 */
function getBrowserStackDesktopCapabilities(options = {}) {
    const browser = options.browser || ConfigResolver.browser;
    const browserVersion = options.browserVersion || 'latest';
    const bstackOptions = getBrowserStackOptions(options.bstackOverrides || {});

    return {
        browserName: browser,
        browserVersion,
        'bstack:options': bstackOptions,
    };
}

/**
 * Get BrowserStack mobile browser capabilities (real device or emulator).
 *
 * @param {Object} [options={}]
 * @param {string} [options.deviceName] - Device name (e.g. 'iPhone 15 Pro Max').
 * @param {string} [options.platformName='Android'] - 'Android' or 'iOS'.
 * @param {string} [options.osVersion] - OS version (e.g. '17.0', '14.0').
 * @param {string} [options.browser='chrome'] - Mobile browser: 'chrome' or 'safari'.
 * @param {boolean} [options.realMobile=true] - Use a real device (vs emulator/simulator).
 * @param {Object} [options.bstackOverrides={}] - Override bstack:options fields.
 * @returns {Object} WebdriverIO capability object for BrowserStack mobile browser.
 *
 * @example
 * const caps = getBrowserStackMobileCapabilities({
 *   deviceName: 'Samsung Galaxy S24',
 *   platformName: 'Android',
 *   osVersion: '14.0',
 * });
 */
function getBrowserStackMobileCapabilities(options = {}) {
    const bstackOptions = getBrowserStackOptions({
        deviceName: options.deviceName || ConfigResolver.get('BROWSERSTACK_DEVICE', 'Samsung Galaxy S24'),
        realMobile: options.realMobile !== false ? 'true' : 'false',
        appiumVersion: ConfigResolver.get('BROWSERSTACK_APPIUM_VERSION', '') || undefined,
        ...(options.bstackOverrides || {}),
    });

    return {
        browserName: options.browser || (options.platformName === 'iOS' ? 'safari' : 'chrome'),
        platformName: options.platformName || 'Android',
        'bstack:options': {
            ...bstackOptions,
            osVersion: options.osVersion || ConfigResolver.get('BROWSERSTACK_OS_VERSION', '14.0'),
        },
    };
}

/**
 * Get BrowserStack mobile app testing capabilities.
 *
 * @param {Object} [options={}]
 * @param {string} [options.app] - BrowserStack app URL (bs://hash). Defaults to BROWSERSTACK_APP_URL.
 * @param {string} [options.deviceName] - Device name.
 * @param {string} [options.platformName='Android'] - 'Android' or 'iOS'.
 * @param {string} [options.osVersion] - OS version.
 * @param {boolean} [options.realMobile=true] - Use real device.
 * @param {Object} [options.bstackOverrides={}] - Override bstack:options fields.
 * @returns {Object} WebdriverIO capability object for BrowserStack app testing.
 *
 * @example
 * const caps = getBrowserStackAppCapabilities({
 *   app: 'bs://a1b2c3d4e5',
 *   deviceName: 'Google Pixel 8',
 *   platformName: 'Android',
 *   osVersion: '14.0',
 * });
 */
function getBrowserStackAppCapabilities(options = {}) {
    const appUrl = options.app || ConfigResolver.get('BROWSERSTACK_APP_URL');
    if (!appUrl) {
        throw new Error(
            'BrowserStack app URL missing. Set BROWSERSTACK_APP_URL or pass options.app (bs://hash).',
        );
    }

    const bstackOptions = getBrowserStackOptions({
        deviceName: options.deviceName || ConfigResolver.get('BROWSERSTACK_DEVICE', 'Samsung Galaxy S24'),
        realMobile: options.realMobile !== false ? 'true' : 'false',
        appiumVersion: ConfigResolver.get('BROWSERSTACK_APPIUM_VERSION', '2.0.0'),
        ...(options.bstackOverrides || {}),
    });

    return {
        platformName: options.platformName || 'Android',
        'appium:app': appUrl,
        'bstack:options': {
            ...bstackOptions,
            osVersion: options.osVersion || ConfigResolver.get('BROWSERSTACK_OS_VERSION', '14.0'),
        },
    };
}

module.exports = {
    getBrowserStackOptions,
    getBrowserStackDesktopCapabilities,
    getBrowserStackMobileCapabilities,
    getBrowserStackAppCapabilities,
};
