/**
 * ═══════════════════════════════════════════════════════════════
 * iOS Capabilities
 * ═══════════════════════════════════════════════════════════════
 */

function getIOSCapabilities(options = {}) {
    return {
        platformName: 'iOS',
        'appium:automationName': 'XCUITest',
        'appium:deviceName': options.deviceName || process.env.IOS_DEVICE || 'iPhone 15',
        'appium:platformVersion': options.platformVersion || process.env.IOS_VERSION || '17.0',
        'appium:app': options.app || process.env.IOS_APP || '',
        'appium:bundleId': options.bundleId || process.env.IOS_BUNDLE_ID || '',
        'appium:noReset': options.noReset !== undefined ? options.noReset : true,
        'appium:fullReset': options.fullReset || false,
        'appium:autoAcceptAlerts': true,
        'appium:newCommandTimeout': 300,
        'appium:wdaStartupRetries': 3,
        'appium:wdaStartupRetryInterval': 20000,
        'appium:useNewWDA': false,
        'appium:showXcodeLog': false,
    };
}

function getIOSSafariCapabilities(options = {}) {
    return {
        platformName: 'iOS',
        browserName: 'Safari',
        'appium:automationName': 'XCUITest',
        'appium:deviceName': options.deviceName || process.env.IOS_DEVICE || 'iPhone 15',
        'appium:platformVersion': options.platformVersion || process.env.IOS_VERSION || '17.0',
        'appium:noReset': true,
        'appium:newCommandTimeout': 300,
        'appium:autoAcceptAlerts': true,
        'appium:safariAllowPopups': true,
    };
}

module.exports = { getIOSCapabilities, getIOSSafariCapabilities };
