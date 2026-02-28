/**
 * Mobile Capabilities Index — Android & iOS
 */

const { getAndroidCapabilities, getAndroidChromeCapabilities } = require('./android');
const { getIOSCapabilities, getIOSSafariCapabilities } = require('./ios');

/**
 * Resolve mobile device capabilities based on a platform name.
 *
 * @param {string} platformName - 'android' | 'android-chrome' | 'ios' | 'ios-safari'
 * @param {Object} [options]    - Additional capability overrides
 * @returns {Object} WebdriverIO capability object
 */
function resolveMobileCapabilities(platformName, options = {}) {
    const name = (platformName || 'android').toLowerCase();

    switch (name) {
        case 'android':
            return getAndroidCapabilities(options);
        case 'android-chrome':
            return getAndroidChromeCapabilities(options);
        case 'ios':
            return getIOSCapabilities(options);
        case 'ios-safari':
            return getIOSSafariCapabilities(options);
        default:
            throw new Error(
                `Unsupported mobile platform: "${name}". Use android, android-chrome, ios, or ios-safari.`,
            );
    }
}

module.exports = {
    getAndroidCapabilities,
    getAndroidChromeCapabilities,
    getIOSCapabilities,
    getIOSSafariCapabilities,
    resolveMobileCapabilities,
};
