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

/**
 * Resolve browser/device capabilities based on the BROWSER env variable.
 */
function resolveCapabilities(browserName, options = {}) {
    const name = (browserName || process.env.BROWSER || 'chrome').toLowerCase();

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

module.exports = {
    getChromeCapabilities,
    getFirefoxCapabilities,
    getEdgeCapabilities,
    getAndroidCapabilities,
    getAndroidChromeCapabilities,
    getIOSCapabilities,
    getIOSSafariCapabilities,
    resolveCapabilities,
};
