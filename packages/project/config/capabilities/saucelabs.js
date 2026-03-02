/**
 * ═══════════════════════════════════════════════════════════════
 * Sauce Labs Cloud Capabilities
 * ═══════════════════════════════════════════════════════════════
 *
 * Generates WebdriverIO capabilities for running tests on Sauce Labs.
 * Supports desktop browsers, mobile emulators/simulators, and real devices.
 *
 * Required environment variables (set via .env or ConfigResolver):
 *   SAUCE_USERNAME   — Sauce Labs account username
 *   SAUCE_ACCESS_KEY — Sauce Labs access key
 *
 * Optional environment variables:
 *   SAUCE_REGION          — Data center: 'us-west-1' (default) | 'eu-central-1' | 'apac-southeast-1'
 *   SAUCE_BUILD           — Build name (default: auto-generated)
 *   SAUCE_TUNNEL_NAME     — Sauce Connect tunnel name
 *   SAUCE_TUNNEL_OWNER    — Tunnel owner (for shared tunnels)
 *   SAUCE_SCREEN_RESOLUTION — Screen resolution (e.g. '1920x1080')
 *   SAUCE_EXTENDED_DEBUGGING — Enable extended debugging ('true'/'false')
 *   SAUCE_CAPTURE_PERFORMANCE — Capture performance metrics ('true'/'false')
 *   SAUCE_IDLE_TIMEOUT    — Idle timeout in seconds (default: 90)
 *   SAUCE_MAX_DURATION    — Max test duration in seconds (default: 1800)
 *   SAUCE_RECORD_VIDEO    — Record video ('true'/'false', default: 'true')
 *   SAUCE_RECORD_SCREENSHOTS — Record screenshots ('true'/'false', default: 'true')
 *   SAUCE_RECORD_LOGS     — Record logs ('true'/'false', default: 'true')
 *   SAUCE_DEVICE          — Mobile device name
 *   SAUCE_PLATFORM_VERSION — Mobile platform version
 *   SAUCE_APP_URL         — Sauce Storage app URL (storage:filename or URL)
 *   SAUCE_APPIUM_VERSION  — Appium version
 *
 * @module capabilities/saucelabs
 * @see {@link https://docs.saucelabs.com/dev/test-configuration-options/|Sauce Labs Config}
 */

const { ConfigResolver } = require('@wdio-framework/core');

/**
 * Get the Sauce Labs WebDriver protocol URL for the configured region.
 *
 * @param {string} [region] - Override region: 'us-west-1', 'eu-central-1', 'apac-southeast-1'.
 * @returns {{ protocol: string, hostname: string, port: number, path: string }}
 *
 * @example
 * const conn = getSauceConnection('eu-central-1');
 * // { protocol: 'https', hostname: 'ondemand.eu-central-1.saucelabs.com', port: 443, path: '/wd/hub' }
 */
function getSauceConnection(region) {
    const r = (region || ConfigResolver.get('SAUCE_REGION', 'us-west-1')).toLowerCase();
    const hostMap = {
        'us-west-1': 'ondemand.us-west-1.saucelabs.com',
        'eu-central-1': 'ondemand.eu-central-1.saucelabs.com',
        'apac-southeast-1': 'ondemand.apac-southeast-1.saucelabs.com',
    };

    return {
        protocol: 'https',
        hostname: hostMap[r] || hostMap['us-west-1'],
        port: 443,
        path: '/wd/hub',
    };
}

/**
 * Build the `sauce:options` capability block.
 *
 * @param {Object} [overrides={}] - Override any sauce:options field.
 * @returns {Object} The sauce:options capability object.
 *
 * @example
 * const opts = getSauceOptions({ name: 'Login Suite', tags: ['smoke'] });
 */
function getSauceOptions(overrides = {}) {
    const username = ConfigResolver.get('SAUCE_USERNAME');
    const accessKey = ConfigResolver.get('SAUCE_ACCESS_KEY');

    if (!username || !accessKey) {
        throw new Error(
            'Sauce Labs credentials missing. Set SAUCE_USERNAME and SAUCE_ACCESS_KEY.',
        );
    }

    const buildName =
        ConfigResolver.get('SAUCE_BUILD') ||
        `Build-${new Date().toISOString().replace(/[:.]/g, '-')}`;

    return {
        username,
        accessKey,
        build: buildName,
        name: overrides.name || 'Automated Test',
        tags: overrides.tags || [],
        tunnelName: ConfigResolver.get('SAUCE_TUNNEL_NAME', '') || undefined,
        tunnelOwner: ConfigResolver.get('SAUCE_TUNNEL_OWNER', '') || undefined,
        screenResolution: ConfigResolver.get('SAUCE_SCREEN_RESOLUTION', '') || undefined,
        extendedDebugging: ConfigResolver.getBool('SAUCE_EXTENDED_DEBUGGING'),
        capturePerformance: ConfigResolver.getBool('SAUCE_CAPTURE_PERFORMANCE'),
        idleTimeout: ConfigResolver.getInt('SAUCE_IDLE_TIMEOUT', 90),
        maxDuration: ConfigResolver.getInt('SAUCE_MAX_DURATION', 1800),
        recordVideo: ConfigResolver.getBool('SAUCE_RECORD_VIDEO', true),
        recordScreenshots: ConfigResolver.getBool('SAUCE_RECORD_SCREENSHOTS', true),
        recordLogs: ConfigResolver.getBool('SAUCE_RECORD_LOGS', true),
        ...overrides,
    };
}

/**
 * Get Sauce Labs desktop browser capabilities.
 *
 * @param {Object} [options={}]
 * @param {string} [options.browser='chrome'] - Browser name.
 * @param {string} [options.browserVersion='latest'] - Browser version.
 * @param {string} [options.platformName='Windows 11'] - OS platform.
 * @param {Object} [options.sauceOverrides={}] - Override sauce:options fields.
 * @returns {Object} WebdriverIO capability object for Sauce Labs desktop.
 *
 * @example
 * const caps = getSauceDesktopCapabilities({ browser: 'firefox', platformName: 'macOS 14' });
 */
function getSauceDesktopCapabilities(options = {}) {
    const browser = options.browser || ConfigResolver.browser;
    const browserVersion = options.browserVersion || 'latest';
    const platformName = options.platformName || 'Windows 11';
    const sauceOptions = getSauceOptions(options.sauceOverrides || {});

    return {
        browserName: browser,
        browserVersion,
        platformName,
        'sauce:options': sauceOptions,
    };
}

/**
 * Get Sauce Labs mobile emulator/simulator capabilities.
 *
 * @param {Object} [options={}]
 * @param {string} [options.deviceName] - Device name (e.g. 'iPhone Simulator', 'Android GoogleAPI Emulator').
 * @param {string} [options.platformName='Android'] - 'Android' or 'iOS'.
 * @param {string} [options.platformVersion] - OS version.
 * @param {string} [options.browser] - Mobile browser name.
 * @param {Object} [options.sauceOverrides={}] - Override sauce:options fields.
 * @returns {Object} WebdriverIO capability object for Sauce Labs mobile emulator.
 *
 * @example
 * const caps = getSauceMobileCapabilities({
 *   deviceName: 'iPhone Simulator',
 *   platformName: 'iOS',
 *   platformVersion: '17.0',
 * });
 */
function getSauceMobileCapabilities(options = {}) {
    const sauceOptions = getSauceOptions({
        appiumVersion: ConfigResolver.get('SAUCE_APPIUM_VERSION', '') || undefined,
        ...(options.sauceOverrides || {}),
    });

    return {
        browserName: options.browser || (options.platformName === 'iOS' ? 'Safari' : 'Chrome'),
        platformName: options.platformName || 'Android',
        'appium:deviceName': options.deviceName || ConfigResolver.get('SAUCE_DEVICE', 'Android GoogleAPI Emulator'),
        'appium:platformVersion': options.platformVersion || ConfigResolver.get('SAUCE_PLATFORM_VERSION', '14.0'),
        'appium:automationName': options.platformName === 'iOS' ? 'XCUITest' : 'UiAutomator2',
        'sauce:options': sauceOptions,
    };
}

/**
 * Get Sauce Labs mobile app testing capabilities.
 *
 * @param {Object} [options={}]
 * @param {string} [options.app] - Sauce Storage URL (storage:filename=app.apk or direct URL).
 * @param {string} [options.deviceName] - Device name.
 * @param {string} [options.platformName='Android'] - 'Android' or 'iOS'.
 * @param {string} [options.platformVersion] - OS version.
 * @param {Object} [options.sauceOverrides={}] - Override sauce:options fields.
 * @returns {Object} WebdriverIO capability object for Sauce Labs app testing.
 *
 * @example
 * const caps = getSauceAppCapabilities({
 *   app: 'storage:filename=myApp.apk',
 *   deviceName: 'Google Pixel 8 GoogleAPI Emulator',
 * });
 */
function getSauceAppCapabilities(options = {}) {
    const appUrl = options.app || ConfigResolver.get('SAUCE_APP_URL');
    if (!appUrl) {
        throw new Error(
            'Sauce Labs app URL missing. Set SAUCE_APP_URL or pass options.app.',
        );
    }

    const sauceOptions = getSauceOptions({
        appiumVersion: ConfigResolver.get('SAUCE_APPIUM_VERSION', '2.0.0'),
        ...(options.sauceOverrides || {}),
    });

    return {
        platformName: options.platformName || 'Android',
        'appium:app': appUrl,
        'appium:deviceName': options.deviceName || ConfigResolver.get('SAUCE_DEVICE', 'Android GoogleAPI Emulator'),
        'appium:platformVersion': options.platformVersion || ConfigResolver.get('SAUCE_PLATFORM_VERSION', '14.0'),
        'appium:automationName': options.platformName === 'iOS' ? 'XCUITest' : 'UiAutomator2',
        'sauce:options': sauceOptions,
    };
}

module.exports = {
    getSauceConnection,
    getSauceOptions,
    getSauceDesktopCapabilities,
    getSauceMobileCapabilities,
    getSauceAppCapabilities,
};
