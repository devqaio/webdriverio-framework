/**
 * ═══════════════════════════════════════════════════════════════
 * LambdaTest Cloud Capabilities
 * ═══════════════════════════════════════════════════════════════
 *
 * Generates WebdriverIO capabilities for running tests on LambdaTest.
 * Supports desktop browsers, mobile emulators, and real devices.
 *
 * Required environment variables (set via .env or ConfigResolver):
 *   LAMBDATEST_USERNAME   — LambdaTest account username
 *   LAMBDATEST_ACCESS_KEY — LambdaTest access key
 *
 * Optional environment variables:
 *   LAMBDATEST_BUILD          — Build name (default: auto-generated)
 *   LAMBDATEST_PROJECT        — Project name
 *   LAMBDATEST_TUNNEL         — Enable Lambda Tunnel ('true'/'false')
 *   LAMBDATEST_TUNNEL_NAME    — Tunnel name
 *   LAMBDATEST_VIDEO          — Record video ('true'/'false', default: 'true')
 *   LAMBDATEST_CONSOLE_LOGS   — Capture console logs ('true'/'false')
 *   LAMBDATEST_NETWORK_LOGS   — Capture network logs ('true'/'false')
 *   LAMBDATEST_VISUAL         — Enable visual testing ('true'/'false')
 *   LAMBDATEST_RESOLUTION     — Screen resolution (e.g. '1920x1080')
 *   LAMBDATEST_SELENIUM_VERSION — Selenium version (default: '4.0')
 *   LAMBDATEST_DEVICE         — Mobile device name
 *   LAMBDATEST_PLATFORM_VERSION — Mobile platform version
 *   LAMBDATEST_APP_URL        — LambdaTest app URL (lt://appHash)
 *   LAMBDATEST_APPIUM_VERSION — Appium version
 *
 * @module capabilities/lambdatest
 * @see {@link https://www.lambdatest.com/support/docs/selenium-automation-capabilities/|LambdaTest Capabilities}
 */

const { ConfigResolver } = require('@wdio-framework/core');

/**
 * Get the LambdaTest hub connection settings.
 *
 * @returns {{ protocol: string, hostname: string, port: number, path: string }}
 *
 * @example
 * const conn = getLambdaTestConnection();
 * // { protocol: 'https', hostname: 'hub.lambdatest.com', port: 443, path: '/wd/hub' }
 */
function getLambdaTestConnection() {
    return {
        protocol: 'https',
        hostname: 'hub.lambdatest.com',
        port: 443,
        path: '/wd/hub',
    };
}

/**
 * Build the `LT:Options` capability block.
 *
 * @param {Object} [overrides={}] - Override any LT:Options field.
 * @returns {Object} The LT:Options capability object.
 *
 * @example
 * const opts = getLambdaTestOptions({ name: 'Login Tests', tags: ['smoke'] });
 */
function getLambdaTestOptions(overrides = {}) {
    const username = ConfigResolver.get('LAMBDATEST_USERNAME');
    const accessKey = ConfigResolver.get('LAMBDATEST_ACCESS_KEY');

    if (!username || !accessKey) {
        throw new Error(
            'LambdaTest credentials missing. Set LAMBDATEST_USERNAME and LAMBDATEST_ACCESS_KEY.',
        );
    }

    const buildName =
        ConfigResolver.get('LAMBDATEST_BUILD') ||
        `Build-${new Date().toISOString().replace(/[:.]/g, '-')}`;

    return {
        username,
        accessKey,
        build: buildName,
        project: ConfigResolver.get('LAMBDATEST_PROJECT') || ConfigResolver.get('PROJECT_NAME', 'wdio-tests'),
        name: overrides.name || 'Automated Test',
        tunnel: ConfigResolver.getBool('LAMBDATEST_TUNNEL'),
        tunnelName: ConfigResolver.get('LAMBDATEST_TUNNEL_NAME', '') || undefined,
        video: ConfigResolver.getBool('LAMBDATEST_VIDEO', true),
        console: ConfigResolver.getBool('LAMBDATEST_CONSOLE_LOGS'),
        network: ConfigResolver.getBool('LAMBDATEST_NETWORK_LOGS'),
        visual: ConfigResolver.getBool('LAMBDATEST_VISUAL'),
        resolution: ConfigResolver.get('LAMBDATEST_RESOLUTION', '') || undefined,
        selenium_version: ConfigResolver.get('LAMBDATEST_SELENIUM_VERSION', '4.0'),
        ...overrides,
    };
}

/**
 * Get LambdaTest desktop browser capabilities.
 *
 * @param {Object} [options={}]
 * @param {string} [options.browser='chrome'] - Browser name.
 * @param {string} [options.browserVersion='latest'] - Browser version.
 * @param {string} [options.platformName='Windows 11'] - OS platform.
 * @param {Object} [options.ltOverrides={}] - Override LT:Options fields.
 * @returns {Object} WebdriverIO capability object for LambdaTest desktop.
 *
 * @example
 * const caps = getLambdaTestDesktopCapabilities({ browser: 'edge', platformName: 'macOS Sonoma' });
 */
function getLambdaTestDesktopCapabilities(options = {}) {
    const browser = options.browser || ConfigResolver.browser;
    const browserVersion = options.browserVersion || 'latest';
    const platformName = options.platformName || 'Windows 11';
    const ltOptions = getLambdaTestOptions(options.ltOverrides || {});

    return {
        browserName: browser,
        browserVersion,
        platformName,
        'LT:Options': ltOptions,
    };
}

/**
 * Get LambdaTest mobile capabilities (emulator/simulator or real device).
 *
 * @param {Object} [options={}]
 * @param {string} [options.deviceName] - Device name.
 * @param {string} [options.platformName='Android'] - 'Android' or 'iOS'.
 * @param {string} [options.platformVersion] - OS version.
 * @param {string} [options.browser] - Mobile browser name.
 * @param {boolean} [options.isRealMobile=true] - Use real device.
 * @param {Object} [options.ltOverrides={}] - Override LT:Options fields.
 * @returns {Object} WebdriverIO capability object for LambdaTest mobile.
 *
 * @example
 * const caps = getLambdaTestMobileCapabilities({
 *   deviceName: 'Pixel 8',
 *   platformVersion: '14',
 * });
 */
function getLambdaTestMobileCapabilities(options = {}) {
    const ltOptions = getLambdaTestOptions({
        isRealMobile: options.isRealMobile !== false,
        appiumVersion: ConfigResolver.get('LAMBDATEST_APPIUM_VERSION', '') || undefined,
        ...(options.ltOverrides || {}),
    });

    return {
        browserName: options.browser || (options.platformName === 'iOS' ? 'Safari' : 'Chrome'),
        platformName: options.platformName || 'Android',
        'appium:deviceName': options.deviceName || ConfigResolver.get('LAMBDATEST_DEVICE', 'Pixel 8'),
        'appium:platformVersion': options.platformVersion || ConfigResolver.get('LAMBDATEST_PLATFORM_VERSION', '14.0'),
        'LT:Options': ltOptions,
    };
}

/**
 * Get LambdaTest mobile app testing capabilities.
 *
 * @param {Object} [options={}]
 * @param {string} [options.app] - LambdaTest app URL (lt://appHash).
 * @param {string} [options.deviceName] - Device name.
 * @param {string} [options.platformName='Android'] - 'Android' or 'iOS'.
 * @param {string} [options.platformVersion] - OS version.
 * @param {boolean} [options.isRealMobile=true] - Use real device.
 * @param {Object} [options.ltOverrides={}] - Override LT:Options fields.
 * @returns {Object} WebdriverIO capability object for LambdaTest app testing.
 *
 * @example
 * const caps = getLambdaTestAppCapabilities({
 *   app: 'lt://APP123456',
 *   deviceName: 'iPhone 15',
 *   platformName: 'iOS',
 * });
 */
function getLambdaTestAppCapabilities(options = {}) {
    const appUrl = options.app || ConfigResolver.get('LAMBDATEST_APP_URL');
    if (!appUrl) {
        throw new Error(
            'LambdaTest app URL missing. Set LAMBDATEST_APP_URL or pass options.app.',
        );
    }

    const ltOptions = getLambdaTestOptions({
        isRealMobile: options.isRealMobile !== false,
        appiumVersion: ConfigResolver.get('LAMBDATEST_APPIUM_VERSION', '2.0.0'),
        ...(options.ltOverrides || {}),
    });

    return {
        platformName: options.platformName || 'Android',
        'appium:app': appUrl,
        'appium:deviceName': options.deviceName || ConfigResolver.get('LAMBDATEST_DEVICE', 'Pixel 8'),
        'appium:platformVersion': options.platformVersion || ConfigResolver.get('LAMBDATEST_PLATFORM_VERSION', '14.0'),
        'LT:Options': ltOptions,
    };
}

module.exports = {
    getLambdaTestConnection,
    getLambdaTestOptions,
    getLambdaTestDesktopCapabilities,
    getLambdaTestMobileCapabilities,
    getLambdaTestAppCapabilities,
};
