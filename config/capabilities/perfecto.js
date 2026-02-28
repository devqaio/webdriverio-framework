/**
 * ═══════════════════════════════════════════════════════════════
 * Perfecto Cloud Capabilities
 * ═══════════════════════════════════════════════════════════════
 *
 * Generates WebdriverIO capabilities for running tests on Perfecto
 * Smart Testing Platform. Supports desktop web, mobile web, and
 * native mobile app testing on real devices.
 *
 * Required environment variables (set via .env or ConfigResolver):
 *   PERFECTO_CLOUD_NAME     — Perfecto cloud name (e.g. 'mycompany')
 *   PERFECTO_SECURITY_TOKEN — Perfecto security token
 *
 * Optional environment variables:
 *   PERFECTO_PROJECT        — Project name
 *   PERFECTO_JOB_NAME       — CI job name
 *   PERFECTO_JOB_NUMBER     — CI build number
 *   PERFECTO_TAGS           — Comma-separated test tags
 *   PERFECTO_REPORT_MODEL   — 'single' or 'parallel' (default: 'single')
 *   PERFECTO_DEVICE_NAME    — Device name (e.g. 'Samsung Galaxy S24')
 *   PERFECTO_PLATFORM_NAME  — 'Android' or 'iOS'
 *   PERFECTO_PLATFORM_VERSION — OS version
 *   PERFECTO_MANUFACTURER   — Device manufacturer (e.g. 'Samsung', 'Apple')
 *   PERFECTO_MODEL          — Device model (e.g. 'Galaxy S24', 'iPhone-15')
 *   PERFECTO_LOCATION       — Lab location (e.g. 'US East', 'EU Frankfurt')
 *   PERFECTO_RESOLUTION     — Screen resolution for desktop (e.g. '1920x1080')
 *   PERFECTO_APP_URL        — App URL or REPOSITORY path for native app testing
 *   PERFECTO_AUTO_INSTRUMENT — Auto-instrument for performance ('true'/'false')
 *   PERFECTO_SENSOR_INSTRUMENT — Instrument device sensors ('true'/'false')
 *
 * @module capabilities/perfecto
 * @see {@link https://developers.perfectomobile.com/|Perfecto Docs}
 */

const { ConfigResolver } = require('@wdio-framework/core');

/**
 * Get the Perfecto cloud connection settings.
 *
 * @param {string} [cloudName] - Override cloud name.
 * @returns {{ protocol: string, hostname: string, port: number, path: string }}
 *
 * @example
 * const conn = getPerfectoConnection('mycompany');
 * // { protocol: 'https', hostname: 'mycompany.perfectomobile.com', port: 443, path: '/nexperience/perfectomobile/wd/hub' }
 */
function getPerfectoConnection(cloudName) {
    const cloud = cloudName || ConfigResolver.get('PERFECTO_CLOUD_NAME');
    if (!cloud) {
        throw new Error('Perfecto cloud name missing. Set PERFECTO_CLOUD_NAME.');
    }

    return {
        protocol: 'https',
        hostname: `${cloud}.perfectomobile.com`,
        port: 443,
        path: '/nexperience/perfectomobile/wd/hub',
    };
}

/**
 * Build common Perfecto options (perfecto:options).
 *
 * @param {Object} [overrides={}] - Override any perfecto:options field.
 * @returns {Object} The perfecto:options capability object.
 *
 * @example
 * const opts = getPerfectoOptions({ tags: ['nightly', 'regression'] });
 */
function getPerfectoOptions(overrides = {}) {
    const securityToken = ConfigResolver.get('PERFECTO_SECURITY_TOKEN');
    if (!securityToken) {
        throw new Error(
            'Perfecto security token missing. Set PERFECTO_SECURITY_TOKEN.',
        );
    }

    const tags = overrides.tags ||
        (ConfigResolver.get('PERFECTO_TAGS', '') || '')
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);

    return {
        securityToken,
        projectName: ConfigResolver.get('PERFECTO_PROJECT') || ConfigResolver.get('PROJECT_NAME', 'wdio-tests'),
        projectVersion: '1.0',
        jobName: ConfigResolver.get('PERFECTO_JOB_NAME', '') || undefined,
        jobNumber: ConfigResolver.get('PERFECTO_JOB_NUMBER', '') ? Number(ConfigResolver.get('PERFECTO_JOB_NUMBER')) : undefined,
        tags: tags.length > 0 ? tags : undefined,
        report: {
            model: ConfigResolver.get('PERFECTO_REPORT_MODEL', 'single'),
        },
        ...overrides,
    };
}

/**
 * Get Perfecto desktop browser capabilities (Perfecto web machines).
 *
 * @param {Object} [options={}]
 * @param {string} [options.browser='chrome'] - Browser name.
 * @param {string} [options.browserVersion='latest'] - Browser version.
 * @param {string} [options.platformName='Windows'] - OS platform.
 * @param {string} [options.platformVersion='11'] - OS version.
 * @param {string} [options.resolution] - Screen resolution.
 * @param {Object} [options.perfectoOverrides={}] - Override perfecto:options fields.
 * @returns {Object} WebdriverIO capability object for Perfecto desktop.
 *
 * @example
 * const caps = getPerfectoDesktopCapabilities({
 *   browser: 'safari',
 *   platformName: 'Mac',
 *   platformVersion: '14',
 * });
 */
function getPerfectoDesktopCapabilities(options = {}) {
    const browser = options.browser || ConfigResolver.browser;
    const perfectoOptions = getPerfectoOptions(options.perfectoOverrides || {});

    return {
        browserName: browser,
        browserVersion: options.browserVersion || 'latest',
        platformName: options.platformName || 'Windows',
        platformVersion: options.platformVersion || '11',
        resolution: options.resolution || ConfigResolver.get('PERFECTO_RESOLUTION', '1920x1080'),
        'perfecto:options': perfectoOptions,
    };
}

/**
 * Get Perfecto real-device mobile web capabilities.
 *
 * @param {Object} [options={}]
 * @param {string} [options.deviceName] - Perfecto device name.
 * @param {string} [options.platformName='Android'] - 'Android' or 'iOS'.
 * @param {string} [options.platformVersion] - OS version.
 * @param {string} [options.manufacturer] - Device manufacturer filter.
 * @param {string} [options.model] - Device model filter.
 * @param {string} [options.location] - Lab location filter.
 * @param {string} [options.browser] - Mobile browser.
 * @param {Object} [options.perfectoOverrides={}] - Override perfecto:options fields.
 * @returns {Object} WebdriverIO capability for Perfecto mobile web.
 *
 * @example
 * const caps = getPerfectoMobileWebCapabilities({
 *   platformName: 'Android',
 *   manufacturer: 'Samsung',
 *   model: 'Galaxy S24',
 * });
 */
function getPerfectoMobileWebCapabilities(options = {}) {
    const perfectoOptions = getPerfectoOptions({
        autoInstrument: ConfigResolver.getBool('PERFECTO_AUTO_INSTRUMENT'),
        sensorInstrument: ConfigResolver.getBool('PERFECTO_SENSOR_INSTRUMENT'),
        ...(options.perfectoOverrides || {}),
    });

    const caps = {
        platformName: options.platformName || ConfigResolver.get('PERFECTO_PLATFORM_NAME', 'Android'),
        browserName: options.browser || (options.platformName === 'iOS' ? 'Safari' : 'Chrome'),
        'perfecto:options': perfectoOptions,
    };

    // Device selection: by name, manufacturer/model, or platform version
    if (options.deviceName || ConfigResolver.get('PERFECTO_DEVICE_NAME', '')) {
        caps['appium:deviceName'] = options.deviceName || ConfigResolver.get('PERFECTO_DEVICE_NAME');
    }
    if (options.manufacturer || ConfigResolver.get('PERFECTO_MANUFACTURER', '')) {
        caps['perfecto:options'].manufacturer = options.manufacturer || ConfigResolver.get('PERFECTO_MANUFACTURER');
    }
    if (options.model || ConfigResolver.get('PERFECTO_MODEL', '')) {
        caps['perfecto:options'].model = options.model || ConfigResolver.get('PERFECTO_MODEL');
    }
    if (options.platformVersion || ConfigResolver.get('PERFECTO_PLATFORM_VERSION', '')) {
        caps['appium:platformVersion'] = options.platformVersion || ConfigResolver.get('PERFECTO_PLATFORM_VERSION');
    }
    if (options.location || ConfigResolver.get('PERFECTO_LOCATION', '')) {
        caps['perfecto:options'].location = options.location || ConfigResolver.get('PERFECTO_LOCATION');
    }

    return caps;
}

/**
 * Get Perfecto mobile app testing capabilities (real devices).
 *
 * @param {Object} [options={}]
 * @param {string} [options.app] - App URL or REPOSITORY path (e.g. 'PRIVATE:apps/myApp.apk').
 * @param {string} [options.deviceName] - Perfecto device name.
 * @param {string} [options.platformName='Android'] - 'Android' or 'iOS'.
 * @param {string} [options.platformVersion] - OS version.
 * @param {string} [options.manufacturer] - Device manufacturer.
 * @param {string} [options.model] - Device model.
 * @param {string} [options.bundleId] - iOS bundle identifier.
 * @param {string} [options.appPackage] - Android app package.
 * @param {string} [options.appActivity] - Android app activity.
 * @param {Object} [options.perfectoOverrides={}] - Override perfecto:options fields.
 * @returns {Object} WebdriverIO capability for Perfecto mobile app.
 *
 * @example
 * const caps = getPerfectoAppCapabilities({
 *   app: 'PRIVATE:apps/myApp.apk',
 *   deviceName: 'Samsung Galaxy S24',
 *   platformName: 'Android',
 * });
 */
function getPerfectoAppCapabilities(options = {}) {
    const appUrl = options.app || ConfigResolver.get('PERFECTO_APP_URL');
    if (!appUrl) {
        throw new Error(
            'Perfecto app URL missing. Set PERFECTO_APP_URL or pass options.app.',
        );
    }

    const perfectoOptions = getPerfectoOptions({
        autoInstrument: ConfigResolver.getBool('PERFECTO_AUTO_INSTRUMENT'),
        sensorInstrument: ConfigResolver.getBool('PERFECTO_SENSOR_INSTRUMENT'),
        ...(options.perfectoOverrides || {}),
    });

    const caps = {
        platformName: options.platformName || ConfigResolver.get('PERFECTO_PLATFORM_NAME', 'Android'),
        'appium:app': appUrl,
        'appium:automationName': options.platformName === 'iOS' ? 'XCUITest' : 'UiAutomator2',
        'perfecto:options': perfectoOptions,
    };

    if (options.deviceName || ConfigResolver.get('PERFECTO_DEVICE_NAME', '')) {
        caps['appium:deviceName'] = options.deviceName || ConfigResolver.get('PERFECTO_DEVICE_NAME');
    }
    if (options.platformVersion || ConfigResolver.get('PERFECTO_PLATFORM_VERSION', '')) {
        caps['appium:platformVersion'] = options.platformVersion || ConfigResolver.get('PERFECTO_PLATFORM_VERSION');
    }
    if (options.bundleId) caps['appium:bundleId'] = options.bundleId;
    if (options.appPackage) caps['appium:appPackage'] = options.appPackage;
    if (options.appActivity) caps['appium:appActivity'] = options.appActivity;

    return caps;
}

module.exports = {
    getPerfectoConnection,
    getPerfectoOptions,
    getPerfectoDesktopCapabilities,
    getPerfectoMobileWebCapabilities,
    getPerfectoAppCapabilities,
};
