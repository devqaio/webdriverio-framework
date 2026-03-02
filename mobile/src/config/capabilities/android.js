/**
 * ═══════════════════════════════════════════════════════════════
 * Android Capabilities
 * ═══════════════════════════════════════════════════════════════
 */

const { ConfigResolver } = require('@wdio-framework/core');

function getAndroidCapabilities(options = {}) {
    return {
        platformName: 'Android',
        'appium:automationName': 'UiAutomator2',
        'appium:deviceName': options.deviceName || ConfigResolver.get('ANDROID_DEVICE', 'emulator-5554'),
        'appium:platformVersion': options.platformVersion || ConfigResolver.get('ANDROID_VERSION', '13.0'),
        'appium:app': options.app || ConfigResolver.get('ANDROID_APP'),
        'appium:appPackage': options.appPackage || ConfigResolver.get('ANDROID_APP_PACKAGE'),
        'appium:appActivity': options.appActivity || ConfigResolver.get('ANDROID_APP_ACTIVITY'),
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
        'appium:deviceName': options.deviceName || ConfigResolver.get('ANDROID_DEVICE', 'emulator-5554'),
        'appium:platformVersion': options.platformVersion || ConfigResolver.get('ANDROID_VERSION', '13.0'),
        'appium:noReset': true,
        'appium:newCommandTimeout': 300,
        'appium:chromeOptions': {
            args: ['--disable-popup-blocking', '--disable-translate'],
        },
    };
}

module.exports = { getAndroidCapabilities, getAndroidChromeCapabilities };
