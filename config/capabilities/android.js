/**
 * ═══════════════════════════════════════════════════════════════
 * Android Capabilities
 * ═══════════════════════════════════════════════════════════════
 */

function getAndroidCapabilities(options = {}) {
    return {
        platformName: 'Android',
        'appium:automationName': 'UiAutomator2',
        'appium:deviceName': options.deviceName || process.env.ANDROID_DEVICE || 'emulator-5554',
        'appium:platformVersion': options.platformVersion || process.env.ANDROID_VERSION || '13.0',
        'appium:app': options.app || process.env.ANDROID_APP || '',
        'appium:appPackage': options.appPackage || process.env.ANDROID_APP_PACKAGE || '',
        'appium:appActivity': options.appActivity || process.env.ANDROID_APP_ACTIVITY || '',
        'appium:noReset': options.noReset !== undefined ? options.noReset : true,
        'appium:fullReset': options.fullReset || false,
        'appium:autoGrantPermissions': true,
        'appium:newCommandTimeout': 300,
        'appium:androidInstallTimeout': 120000,
        'appium:adbExecTimeout': 60000,
        ...(options.browserName ? { browserName: options.browserName } : {}),
    };
}

function getAndroidChromeCapabilities(options = {}) {
    return {
        platformName: 'Android',
        browserName: 'Chrome',
        'appium:automationName': 'UiAutomator2',
        'appium:deviceName': options.deviceName || process.env.ANDROID_DEVICE || 'emulator-5554',
        'appium:platformVersion': options.platformVersion || process.env.ANDROID_VERSION || '13.0',
        'appium:noReset': true,
        'appium:newCommandTimeout': 300,
        'appium:chromeOptions': {
            args: ['--disable-popup-blocking', '--disable-translate'],
        },
    };
}

module.exports = { getAndroidCapabilities, getAndroidChromeCapabilities };
