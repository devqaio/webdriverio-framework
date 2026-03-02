/**
 * Web Capabilities Index — Chrome, Firefox, Edge
 */

const { ConfigResolver } = require('@wdio-framework/core');
const { getChromeCapabilities } = require('./chrome');
const { getFirefoxCapabilities } = require('./firefox');
const { getEdgeCapabilities } = require('./edge');

/**
 * Resolve web browser capabilities based on a browser name.
 *
 * @param {string} browserName - 'chrome' | 'firefox' | 'edge'
 * @param {Object} [options]   - Additional capability overrides
 * @returns {Object} WebdriverIO capability object
 */
function resolveWebCapabilities(browserName, options = {}) {
    const name = (browserName || ConfigResolver.browser).toLowerCase();

    switch (name) {
        case 'chrome':
            return getChromeCapabilities(options);
        case 'firefox':
            return getFirefoxCapabilities(options);
        case 'edge':
        case 'microsoftedge':
            return getEdgeCapabilities(options);
        default:
            throw new Error(
                `Unsupported web browser: "${name}". Use chrome, firefox, or edge.`,
            );
    }
}

module.exports = {
    getChromeCapabilities,
    getFirefoxCapabilities,
    getEdgeCapabilities,
    resolveWebCapabilities,
};
