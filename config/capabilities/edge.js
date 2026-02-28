/**
 * ═══════════════════════════════════════════════════════════════
 * Microsoft Edge Capabilities
 * ═══════════════════════════════════════════════════════════════
 */

const { ConfigResolver } = require('@wdio-framework/core');

function getEdgeCapabilities(options = {}) {
    const isHeadless = ConfigResolver.getBool('HEADLESS') || options.headless;
    const width = ConfigResolver.getInt('WINDOW_WIDTH', 1920);
    const height = ConfigResolver.getInt('WINDOW_HEIGHT', 1080);

    const edgeArgs = [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        `--window-size=${width},${height}`,
    ];

    if (isHeadless) {
        edgeArgs.push('--headless=new');
    }

    if (options.args) {
        edgeArgs.push(...options.args);
    }

    return {
        browserName: 'MicrosoftEdge',
        'ms:edgeOptions': {
            args: edgeArgs,
            ...(options.edgeOptions || {}),
        },
    };
}

module.exports = { getEdgeCapabilities };
